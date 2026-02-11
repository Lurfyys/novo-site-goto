// src/services/dashboardService.ts
import { supabase } from './supabaseClient'

/** =========================
 *  TIPOS
 *  ========================= */

export type MyProfileRow = {
  id: string
  name?: string | null
  role?: string | null
  company_id?: string | null
  company_name?: string | null
  created_at?: string | null
}

export type GlobalEmployeeRow = {
  company_id: string | null
  user_id: string
  name: string | null
  entries: number | null
  last_entry_at: string | null
}

export type DailyMoodAggRow = {
  day: string
  avg_score?: number | null
  entries?: number | null
}

export type MoodEntryRow = {
  id: string
  user_id: string
  company_id: string | null
  score: number | null
  day: string | null
  created_at: string | null
}

export type CriticalAlertRow = {
  user_id: string
  name: string | null
  score: number
  day: string | null
  created_at: string | null
}

/** =========================
 *  HELPERS
 *  ========================= */

function throwIfError<T>(res: { data: T; error: any }, msg: string) {
  if (res.error) {
    console.error(msg, res.error)
    throw res.error
  }
  return res.data
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr))
}

async function requireUser() {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error) throw error
  if (!user) throw new Error('Usuário não autenticado.')
  return user
}

/** =========================
 *  SCOPE (admin/role/company)
 *  ========================= */

async function getIsAdminByTable(): Promise<boolean> {
  const user = await requireUser()

  // policy admin_users_self_select permite ler a própria linha
  const { data, error } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle()
  if (error) return false
  return !!data
}

async function getMyProfile(): Promise<MyProfileRow> {
  const user = await requireUser()

  const res = await supabase
    .from('profiles')
    .select('id, name, role, company_id, company_name, created_at')
    .eq('id', user.id)
    .maybeSingle()

  const row = throwIfError(res as any, 'getMyProfile failed') as MyProfileRow | null
  if (!row) throw new Error('Perfil não encontrado (profiles).')
  return row
}

async function getSupervisorCompanyId(): Promise<string | null> {
  const user = await requireUser()

  const res = await supabase
    .from('supervisor_companies')
    .select('company_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const row = throwIfError(res as any, 'getSupervisorCompanyId failed') as { company_id?: string | null } | null
  return row?.company_id ?? null
}

async function getScope(): Promise<{
  isAdmin: boolean
  role: string | null
  profileCompanyId: string | null
  effectiveCompanyId: string | null
}> {
  const [isAdmin, profile] = await Promise.all([getIsAdminByTable(), getMyProfile()])

  const role = (profile.role ?? null) as string | null
  const profileCompanyId = (profile.company_id ?? null) as string | null

  if (isAdmin) {
    return { isAdmin: true, role, profileCompanyId, effectiveCompanyId: null }
  }

  if (role === 'supervisor') {
    const supervisorCompanyId = await getSupervisorCompanyId()
    return {
      isAdmin: false,
      role,
      profileCompanyId,
      effectiveCompanyId: supervisorCompanyId
    }
  }

  // manager/employee => usa company_id do profile
  return {
    isAdmin: false,
    role,
    profileCompanyId,
    effectiveCompanyId: profileCompanyId
  }
}

/** =========================
 *  PERFIL
 *  ========================= */
export async function fetchMyProfile(): Promise<MyProfileRow> {
  return getMyProfile()
}

/** =========================
 *  PERFIS POR IDS
 *  ========================= */
export async function fetchProfilesByIds(userIds: string[]) {
  const ids = uniq((userIds ?? []).filter(Boolean))
  if (ids.length === 0) return new Map<string, { id: string; name: string | null }>()

  const res = await supabase.from('profiles').select('id, name').in('id', ids)
  const rows = throwIfError(res as any, 'fetchProfilesByIds failed') as { id: string; name: string | null }[]

  const map = new Map<string, { id: string; name: string | null }>()
  for (const r of rows) map.set(r.id, r)
  return map
}

/** =========================
 *  EMPLOYEES (dashboard)
 *  - Usa view scopo: v_dashboard_employees
 *  - Admin vê tudo, supervisor vê só a empresa dele
 *  ========================= */
export async function fetchScopedEmployees(): Promise<GlobalEmployeeRow[]> {
  const res = await supabase
    .from('v_dashboard_employees')
    .select('company_id, user_id, name, entries, last_entry_at')
    .order('entries', { ascending: false })
    .order('name', { ascending: true })

  return throwIfError(res as any, 'fetchScopedEmployees failed') as GlobalEmployeeRow[]
}

/** =========================
 *  DAILY MOOD (dashboard)
 *  - Usa view scopo: v_dashboard_daily_mood
 *  ========================= */
export async function fetchScopedDailyMood(days = 30): Promise<DailyMoodAggRow[]> {
  const since = new Date()
  since.setDate(since.getDate() - Math.max(1, days))
  const sinceStr = since.toISOString().slice(0, 10)

  const res = await supabase
    .from('v_dashboard_daily_mood')
    .select('day, avg_score, entries')
    .gte('day', sinceStr)
    .order('day', { ascending: true })

  return throwIfError(res as any, 'fetchScopedDailyMood failed') as DailyMoodAggRow[]
}

/** =========================
 *  ALERTAS CRÍTICOS (score=1)
 *  - Admin: tudo
 *  - Supervisor/manager/employee: só empresa efetiva
 *  ========================= */
export async function fetchCriticalAlerts({
  days = 7,
  limit = 10
}: {
  days?: number
  limit?: number
}): Promise<CriticalAlertRow[]> {
  const scope = await getScope()

  const since = new Date()
  since.setDate(since.getDate() - Math.max(1, days))
  const sinceISO = since.toISOString()

  let q = supabase
    .from('mood_entries')
    .select('id, user_id, company_id, score, day, created_at')
    .eq('score', 1)
    .gte('created_at', sinceISO)
    .order('created_at', { ascending: false })
    .limit(Math.max(1, limit))

  if (!scope.isAdmin) {
    if (!scope.effectiveCompanyId) {
      // se não tem empresa, não devolve nada (evita “global” por bug)
      return []
    }
    q = q.eq('company_id', scope.effectiveCompanyId)
  }

  const res = await q
  const entries = throwIfError(res as any, 'fetchCriticalAlerts failed') as MoodEntryRow[]

  const ids = entries.map(e => e.user_id)
  const profilesMap = await fetchProfilesByIds(ids)

  return entries.map(e => ({
    user_id: e.user_id,
    name: profilesMap.get(e.user_id)?.name ?? null,
    score: Number(e.score ?? 0),
    day: e.day ?? null,
    created_at: e.created_at ?? null
  }))
}

/** =========================
 *  BURNOUT 7D
 *  - Admin: tudo
 *  - Outros: por empresa efetiva
 *  ========================= */
export async function fetchBurnout7d(): Promise<{
  avgScore7d: number
  entries7d: number
  criticalOnes7d: number
  count_1_2: number
  count_3: number
  count_4_5: number
}> {
  const scope = await getScope()

  const since = new Date()
  since.setDate(since.getDate() - 7)
  const sinceISO = since.toISOString()

  let q = supabase
    .from('mood_entries')
    .select('score, created_at, company_id')
    .gte('created_at', sinceISO)

  if (!scope.isAdmin) {
    if (!scope.effectiveCompanyId) {
      return {
        avgScore7d: 0,
        entries7d: 0,
        criticalOnes7d: 0,
        count_1_2: 0,
        count_3: 0,
        count_4_5: 0
      }
    }
    q = q.eq('company_id', scope.effectiveCompanyId)
  }

  const res = await q
  const rows = throwIfError(res as any, 'fetchBurnout7d failed') as { score: number | null }[]

  const scores = rows.map(r => Number(r.score ?? 0)).filter(n => Number.isFinite(n) && n > 0)
  const entries7d = scores.length
  const criticalOnes7d = scores.filter(s => s === 1).length
  const avgScore7d = entries7d > 0 ? scores.reduce((a, b) => a + b, 0) / entries7d : 0

  const count_1_2 = scores.filter(s => s === 1 || s === 2).length
  const count_3 = scores.filter(s => s === 3).length
  const count_4_5 = scores.filter(s => s === 4 || s === 5).length

  return {
    avgScore7d: Number.isFinite(avgScore7d) ? avgScore7d : 0,
    entries7d,
    criticalOnes7d,
    count_1_2,
    count_3,
    count_4_5
  }
}
