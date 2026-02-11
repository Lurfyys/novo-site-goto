// services/aiActionsService.ts
export type AiActionItem = {
  title: string
  why: string
  steps: string[]
  priority: 'Alta' | 'Média' | 'Baixa'
  owner_hint?: string
}

function mustEnv(name: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY') {
  const v = (import.meta as any).env?.[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return String(v).trim()
}

export async function fetchAiActions(prompt: string): Promise<AiActionItem[]> {
  const url = mustEnv('VITE_SUPABASE_URL')
  const anon = mustEnv('VITE_SUPABASE_ANON_KEY')

  const res = await fetch(`${url}/functions/v1/ai-actions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anon,
      Authorization: `Bearer ${anon}`
    },
    body: JSON.stringify({ prompt })
  })

  const text = await res.text()
  if (!res.ok) {
    // mostra o erro real vindo da function
    throw new Error(`AI function error ${res.status}: ${text}`)
  }

  let data: any = null
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`Resposta não-JSON da function: ${text}`)
  }

  const actions = Array.isArray(data?.actions) ? data.actions : []
  return actions as AiActionItem[]
}
