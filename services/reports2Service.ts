  // NR1(WEB) → services/reports2Service.ts

  import { supabase } from "./supabaseClient";

  // ── Types ─────────────────────────────────────────────────────

  export interface SurveyQuestionMapRow {
    q_key: string
    slug_key: string
    label: string
  }

  export interface SurveyAggregatedRow {
    company_id: string
    month_key: string
    response_count: number
    avg_score: number
    pct_alto: number
    pct_atencao: number
    pct_baixo: number
    anonymity_blocked: boolean
    // Scores por categoria COPSOQ (null se respostas antigas sem breakdown)
    avg_exigencias_trabalho: number | null
    avg_organizacao_conteudo: number | null
    avg_relacoes_lideranca: number | null
    avg_valores_trabalho: number | null
    avg_inseguranca_laboral: number | null
    avg_saude_geral: number | null
    avg_trabalho_vida_pessoal: number | null
    avg_saude_4semanas: number | null
    avg_comportamentos_ofensivos: number | null
  }

  export interface ProfileMiniRow {
    user_id: string
    full_name?: string | null
    name?: string | null
    email?: string | null
    company_id?: string | null
  }

  // ── fetchSupervisorCompanyId ──────────────────────────────────
  export async function fetchSupervisorCompanyId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('supervisor_companies')
      .select('company_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error
    return data?.company_id ?? null
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

  // ── fetchSurveyResponses (apenas empresa do supervisor) ───────
  export async function fetchSurveyResponses(): Promise<SurveyAggregatedRow[]> {
    const companyId = await fetchSupervisorCompanyId()
    if (!companyId) return []

    const { data, error } = await supabase
      .from('survey_aggregated')
      .select('*')
      .eq('company_id', companyId)
      .order('month_key', { ascending: false })

    if (error) throw error
    return data ?? []
  }

  // ── fetchSurveyResponsesByCompany ────────────────────────────
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