// NR1(WEB) → services/reports2Service.ts
// Substitui o arquivo inteiro
// MUDANÇA PRINCIPAL: fetchSurveyResponses agora lê survey_aggregated
// (view anônima) em vez de survey_responses diretamente.

// ✅ Correto (está na mesma pasta)
import { supabase } from "./supabaseClient";
// ── Types ────────────────────────────────────────────────────

export interface SurveyQuestionMapRow {
  q_key: string
  slug_key: string
  label: string
}

// Dados agregados por empresa/ciclo (sem identificação individual)
export interface SurveyAggregatedRow {
  company_id: string
  month_key: string          // "2025-04"
  response_count: number
  avg_score: number
  pct_alto: number
  pct_atencao: number
  pct_baixo: number
  anonymity_blocked: boolean // true se < 5 respostas no ciclo
}

export interface ProfileMiniRow {
  user_id: string
  full_name?: string | null
  name?: string | null
  email?: string | null
  company_id?: string | null
}

// ── fetchSurveyQuestionMap ────────────────────────────────────
export async function fetchSurveyQuestionMap(): Promise<SurveyQuestionMapRow[]> {
  const { data, error } = await supabase
    .from('survey_question_map')
    .select('q_key, slug_key, label')
    .order('q_key')

  if (error) throw error
  return data ?? []
}

// ── fetchSurveyResponses (agora lê agregado, sem dados pessoais) ──
export async function fetchSurveyResponses(): Promise<SurveyAggregatedRow[]> {
  const { data, error } = await supabase
    .from('survey_aggregated')
    .select('*')
    .order('month_key', { ascending: false })

  if (error) throw error
  return data ?? []
}

// ── fetchSurveyResponsesByCompany ────────────────────────────
// Filtra por empresa específica
export async function fetchSurveyResponsesByCompany(
  companyId: string
): Promise<SurveyAggregatedRow[]> {
  const { data, error } = await supabase
    .from('survey_aggregated')
    .select('*')
    .eq('company_id', companyId)
    .order('month_key', { ascending: false })

  if (error) throw error
  return data ?? []
}

// ── fetchProfilesByUserIds ────────────────────────────────────
// Mantido para outras partes do dashboard que ainda usam profiles
export async function fetchProfilesByUserIds(
  userIds: string[]
): Promise<ProfileMiniRow[]> {
  if (!userIds || userIds.length === 0) return []

  const unique = Array.from(new Set(userIds.filter(Boolean)))
  if (unique.length === 0) return []

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, full_name, name, email, company_id')
    .in('user_id', unique)

  if (error) throw error
  return data ?? []
}

// ── pickBestProfileName ───────────────────────────────────────
export function pickBestProfileName(p?: ProfileMiniRow | null): string {
  if (!p) return 'Usuário'
  return p.full_name || p.name || p.email || 'Usuário'
}