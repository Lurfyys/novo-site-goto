// src/services/reportsService.ts

import { supabase } from './supabaseClient'
// se no seu projeto for outro nome, troque a linha acima por:
// import { supabaseClient as supabase } from './supabaseClient'

export type RiskLevel = 'baixo' | 'atencao' | 'alto' | string

export type SurveyResponseRow = {
  id: string
  user_id: string
  date: string
  total_score: number
  risk_level: RiskLevel
  answers: any
}

export type SurveyQuestionMapRow = {
  q_key: string
  slug_key: string
  label: string
}

/**
 * ✅ Aqui corrigimos: no seu banco, profiles NÃO tem user_id.
 * O user id está em profiles.id (uuid).
 * Então vamos devolver { user_id: profiles.id, name, ... } pra tela não mudar nada.
 */
export type ProfileMiniRow = {
  user_id: string // <- normalizado = profiles.id
  name?: string | null
  role?: string | null
  company_id?: string | null
  company_name?: string | null
  cpf?: string | null
}

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export async function fetchSurveyQuestionMap(): Promise<SurveyQuestionMapRow[]> {
  const { data, error } = await supabase
    .from('survey_question_map')
    .select('q_key, slug_key, label')
    .order('q_key', { ascending: true })

  if (error) throw error
  return (data ?? []) as SurveyQuestionMapRow[]
}

export async function fetchSurveyResponses(params?: { month?: string; userId?: string }): Promise<SurveyResponseRow[]> {
  let q = supabase
    .from('survey_responses')
    .select('id, user_id, date, total_score, risk_level, answers')
    .order('date', { ascending: false })

  if (params?.userId) q = q.eq('user_id', params.userId)

  if (params?.month) {
    const start = `${params.month}-01`
    const endDate = new Date(`${params.month}-01T12:00:00`)
    endDate.setMonth(endDate.getMonth() + 1)
    const end = endDate.toISOString().slice(0, 10)
    q = q.gte('date', start).lt('date', end)
  }

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as SurveyResponseRow[]
}

/**
 * ✅ CORRIGIDO: busca perfis por profiles.id (uuid) e devolve user_id normalizado
 */
export async function fetchProfilesByUserIds(userIds: string[]): Promise<ProfileMiniRow[]> {
  const ids = Array.from(new Set((userIds ?? []).filter(Boolean)))
  if (ids.length === 0) return []

  const batches = chunk(ids, 100)

  const all: ProfileMiniRow[] = []
  for (const b of batches) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, role, company_id, company_name, cpf')
      .in('id', b)

    if (error) throw error

    // normaliza: id -> user_id
    for (const row of (data ?? []) as any[]) {
      all.push({
        user_id: row.id,
        name: row.name ?? null,
        role: row.role ?? null,
        company_id: row.company_id ?? null,
        company_name: row.company_name ?? null,
        cpf: row.cpf ?? null
      })
    }
  }

  return all
}

export function pickBestProfileName(p?: ProfileMiniRow | null): string {
  const name = p?.name?.trim()
  return name || 'Sem nome'
}
