// services/aiActionsService.ts
export type AiActionItem = {
  title: string
  why: string
  steps: string[]
  priority: 'Alta' | 'Média' | 'Baixa'
  owner_hint?: string
}

export type SupervisorAiResponse = {
  actions: AiActionItem[]
  summary?: any
}

export type EmployeeAiResponse = {
  actions: AiActionItem[]
  trend?: 'melhorando' | 'piorando' | 'estável'
}

function mustEnv(name: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY') {
  const v = (import.meta as any).env?.[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return String(v).trim()
}

async function postToFunction(path: string, body: Record<string, unknown>) {
  const url = mustEnv('VITE_SUPABASE_URL')
  const anon = mustEnv('VITE_SUPABASE_ANON_KEY')

  const res = await fetch(`${url}/functions/v1/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
    body: JSON.stringify(body),
  })

  const text = await res.text()

  if (!res.ok) {
    throw new Error(`AI function error ${res.status}: ${text}`)
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Resposta não-JSON da function: ${text}`)
  }
}

export async function fetchSupervisorAiActions(
  companyId: string,
  prompt = ''
): Promise<SupervisorAiResponse> {
  const data = await postToFunction('ai-actions', {
    company_id: companyId,
    prompt,
  })

  return {
    actions: Array.isArray(data?.actions) ? data.actions : [],
    summary: data?.summary,
  }
}

export async function fetchEmployeeAiActions(
  userId: string,
  prompt = ''
): Promise<EmployeeAiResponse> {
  const data = await postToFunction('quick-processor', {
    user_id: userId,
    prompt,
  })

  return {
    actions: Array.isArray(data?.actions) ? data.actions : [],
    trend: data?.trend,
  }
}
export async function fetchAiActions(
  prompt: string,
  companyId?: string
): Promise<AiActionItem[]> {
  if (!companyId) {
    throw new Error('companyId é obrigatório para fetchAiActions.')
  }

  const result = await fetchSupervisorAiActions(companyId, prompt)
  return Array.isArray(result?.actions) ? result.actions : []
}