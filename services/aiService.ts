import { supabase } from './supabaseClient'

export type AiActionItem = {
  title: string
  why: string
  steps: string[]
  priority: string
  owner_hint: string
}

function stripFencesAndNoise(s: string) {
  return String(s ?? '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()
}

// pega o primeiro JSON “provável” dentro de um texto (mesmo se tiver "json " antes)
function extractFirstJsonChunk(s: string) {
  const t = stripFencesAndNoise(s)

  const firstObj = t.indexOf('{')
  const lastObj = t.lastIndexOf('}')
  if (firstObj >= 0 && lastObj > firstObj) return t.slice(firstObj, lastObj + 1)

  const firstArr = t.indexOf('[')
  const lastArr = t.lastIndexOf(']')
  if (firstArr >= 0 && lastArr > firstArr) return t.slice(firstArr, lastArr + 1)

  return t
}

function safeParse(input: any): any {
  if (input == null) return null
  if (typeof input === 'object') return input

  if (typeof input !== 'string') return input

  // tenta parse direto
  let s = stripFencesAndNoise(input)
  s = s.replace(/^json\s*[:=]?\s*/i, '').trim()

  // se vier string JSON-stringificada ("{...}"), parse 1x
  try {
    const v = JSON.parse(s)
    return v
  } catch {
    // tenta achar um JSON dentro do texto ("json { ... }")
    const chunk = extractFirstJsonChunk(s)
    try {
      return JSON.parse(chunk)
    } catch {
      // última tentativa: se o conteúdo estiver JSON-stringificado por dentro
      // ex: "\"json { \\\"actions\\\": ... }\""
      try {
        const inner = JSON.parse(String(input))
        if (typeof inner === 'string') {
          const innerChunk = extractFirstJsonChunk(inner.replace(/^json\s*[:=]?\s*/i, '').trim())
          return JSON.parse(innerChunk)
        }
      } catch {
        /* ignore */
      }
      return null
    }
  }
}

function normalizeActions(payload: any): AiActionItem[] {
  // o supabase.functions.invoke costuma devolver em data: { ... }
  // às vezes vem em data.json ou data.data
  const obj =
    safeParse(payload?.json) ??
    safeParse(payload?.data) ??
    safeParse(payload?.result) ??
    safeParse(payload?.output) ??
    safeParse(payload) ??
    payload

  const actions =
    obj?.actions ??
    obj?.result?.actions ??
    obj?.output?.actions ??
    obj?.data?.actions

  if (!Array.isArray(actions)) return []

  return actions.map((a: any) => {
    const stepsParsed = Array.isArray(a?.steps) ? a.steps : safeParse(a?.steps)
    const steps = Array.isArray(stepsParsed)
      ? stepsParsed.map((x: any) => String(x ?? '').trim()).filter(Boolean)
      : []

    return {
      title: String(a?.title ?? '').trim(),
      why: String(a?.why ?? '').trim(),
      steps,
      priority: String(a?.priority ?? 'Média').trim(),
      owner_hint: String(a?.owner_hint ?? a?.owner ?? 'Sistema').trim()
    }
  })
}

export async function fetchAiActions(prompt: string): Promise<AiActionItem[]> {
  const { data, error } = await supabase.functions.invoke('ai-actions', {
    body: { prompt }
  })
  if (error) throw error

  // DEBUG (depois você remove)
  console.log('ai-actions raw:', data)

  const normalized = normalizeActions(data)
  console.log('ai-actions normalized:', normalized)

  return normalized
}
