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
  day: string // yyyy-mm-dd
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

/** =========================
 *  PERFIL
 *  ========================= */
export async function fetchMyProfile(): Promise<MyProfileRow> {
  const {
    data: { user },
    error: authErr
  } = await supabase.auth.getUser()

  if (authErr) throw authErr
  if (!user) throw new Error('Usuário não autenticado.')

  const res = await supabase
    .from('profiles')
    .select('id, name, role, company_id, created_at')
    .eq('id', user.id)
    .maybeSingle()

  const row = throwIfError(res as any, 'fetchMyProfile failed') as MyProfileRow | null
  if (!row) throw new Error('Perfil não encontrado (profiles).')

  return row
}

/** =========================
 *  GLOBAL
 *  ========================= */

export async function fetchGlobalEmployees(): Promise<GlobalEmployeeRow[]> {
  const res = await supabase
    .from('v_global_employees')
    .select('company_id, user_id, name, entries, last_entry_at')
    .order('entries', { ascending: false })

  return throwIfError(res as any, 'fetchGlobalEmployees failed') as GlobalEmployeeRow[]
}

export async function fetchGlobalDailyMood(days = 30): Promise<DailyMoodAggRow[]> {
  const since = new Date()
  since.setDate(since.getDate() - Math.max(1, days))
  const sinceStr = since.toISOString().slice(0, 10)

  const res = await supabase
    .from('v_global_employee_daily_mood')
    .select('day, avg_score, entries')
    .gte('day', sinceStr)
    .order('day', { ascending: true })

  return throwIfError(res as any, 'fetchGlobalDailyMood failed') as DailyMoodAggRow[]
}

/** =========================
 *  PERFIS POR IDS (sem JOIN)
 *  ========================= */
export async function fetchProfilesByIds(userIds: string[]) {
  const ids = uniq((userIds ?? []).filter(Boolean))
  if (ids.length === 0) return new Map<string, { id: string; name: string | null }>()

  const res = await supabase.from('profiles').select('id, name').in('id', ids)
  const rows = throwIfError(res as any, 'fetchProfilesByIds failed') as {
    id: string
    name: string | null
  }[]

  const map = new Map<string, { id: string; name: string | null }>()
  for (const r of rows) map.set(r.id, r)
  return map
}

/** =========================
 *  ALERTAS CRÍTICOS (score=1)
 *  - filtra por created_at (não day)
 *  ========================= */
export async function fetchCriticalAlerts({
  days = 7,
  limit = 10
}: {
  days?: number
  limit?: number
}): Promise<CriticalAlertRow[]> {
  const since = new Date()
  since.setDate(since.getDate() - Math.max(1, days))
  const sinceISO = since.toISOString()

  const res = await supabase
    .from('mood_entries')
    .select('id, user_id, company_id, score, day, created_at')
    .eq('score', 1)
    .gte('created_at', sinceISO)
    .order('created_at', { ascending: false })
    .limit(Math.max(1, limit))

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
 *  BURNOUT 7D (alimentado)
 *  - agora retorna contagens para donut:
 *    1-2 vermelho, 3 laranja, 4-5 azul
 *  ========================= */
export async function fetchBurnout7d(): Promise<{
  avgScore7d: number
  entries7d: number
  criticalOnes7d: number
  count_1_2: number
  count_3: number
  count_4_5: number
}> {
  const since = new Date()
  since.setDate(since.getDate() - 7)
  const sinceISO = since.toISOString()

  const res = await supabase
    .from('mood_entries')
    .select('score, created_at')
    .gte('created_at', sinceISO)

  const rows = throwIfError(res as any, 'fetchBurnout7d failed') as {
    score: number | null
    created_at: string | null
  }[]

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
