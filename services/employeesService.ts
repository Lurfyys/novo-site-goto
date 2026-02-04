// src/services/employeesService.ts
import { supabase } from './supabaseClient'

/* =========================
   TYPES
========================= */

export type ProfileRow = {
  id: string
  name: string | null
  role: 'manager' | 'employee'
  company_id: string | null
  company_name?: string | null
  created_at?: string | null
}

export type EmployeeRow = {
  company_id: string | null
  user_id: string
  name: string | null
  entries: number | null
  last_entry_at: string | null
}

export type MoodEntryRow = {
  id: string
  user_id: string
  score: number | null
  note: string | null
  created_at: string
  sleep_quality: number | null
  work_demand: number | null
  fatigue_level: number | null
  mental_state: string | null
  day: string | null
  company_id: string | null
}

/* =========================
   AUTH / PROFILE
   ✅ profiles.id = auth.user.id
========================= */

export async function fetchMyProfile(): Promise<ProfileRow> {
  const { data: auth, error: authErr } = await supabase.auth.getUser()
  if (authErr) throw authErr

  const user = auth?.user
  if (!user) throw new Error('Usuário não autenticado')

  // ✅ SEM user_id (não existe). Usa id.
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, role, company_id, company_name, created_at')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Perfil não encontrado (profiles).')

  return data as ProfileRow
}

/* =========================
   EMPLOYEES (GLOBAL)
   ✅ Usa a view global que você tem: v_global_employees
========================= */

export async function fetchAllEmployees(): Promise<EmployeeRow[]> {
  const { data, error } = await supabase
    .from('v_global_employees')
    .select('company_id, user_id, name, entries, last_entry_at')
    .order('entries', { ascending: false })

  if (error) throw error
  return (data ?? []) as EmployeeRow[]
}

/* =========================
   (OPCIONAL) EMPLOYEES POR EMPRESA
   ✅ Pra quando você quiser filtrar por company_id
========================= */

export async function fetchEmployeesByCompany(companyId: string): Promise<EmployeeRow[]> {
  if (!companyId) return []

  const { data, error } = await supabase
    .from('v_global_employees')
    .select('company_id, user_id, name, entries, last_entry_at')
    .eq('company_id', companyId)
    .order('entries', { ascending: false })

  if (error) throw error
  return (data ?? []) as EmployeeRow[]
}

/* =========================
   EMPLOYEE DETAILS
========================= */

export async function fetchEmployeeMoodEntries(
  employeeId: string,
  limit = 50
): Promise<MoodEntryRow[]> {
  if (!employeeId) return []

  const { data, error } = await supabase
    .from('mood_entries')
    .select(
      'id, user_id, score, note, created_at, sleep_quality, work_demand, fatigue_level, mental_state, day, company_id'
    )
    .eq('user_id', employeeId)
    .order('created_at', { ascending: false })
    .limit(Math.max(1, limit))

  if (error) throw error
  return (data ?? []) as MoodEntryRow[]
}
