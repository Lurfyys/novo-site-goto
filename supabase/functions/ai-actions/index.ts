/// <reference lib="deno.ns" />

type ActionItem = {
  title: string
  why: string
  steps: string[]
  priority: "Alta" | "Média" | "Baixa"
  owner_hint: string
}

function corsHeaders(origin?: string) {
  return {
    "access-control-allow-origin": origin ?? "*",
    "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
    "access-control-allow-methods": "POST, OPTIONS",
  }
}

function json(data: unknown, status = 200, origin?: string) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(origin),
    },
  })
}

async function supabaseRest<T>(
  url: string,
  serviceRoleKey: string,
  path: string,
): Promise<T> {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      "apikey": serviceRoleKey,
      "authorization": `Bearer ${serviceRoleKey}`,
      "accept": "application/json",
    },
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Supabase REST error (${res.status}): ${txt}`)
  }

  return (await res.json()) as T
}

function isoDaysAgo(days: number) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

function clampText(s: unknown, max = 220) {
  const t = String(s ?? "").trim()
  if (!t) return ""
  return t.length > max ? t.slice(0, max) + "…" : t
}

// ✅ Extrator robusto do texto da Responses API
function extractOutputText(oaiJson: any): string {
  if (typeof oaiJson?.output_text === "string" && oaiJson.output_text.trim()) {
    return oaiJson.output_text.trim()
  }

  const contentArr = oaiJson?.output?.[0]?.content
  if (Array.isArray(contentArr)) {
    const txt = contentArr
      .map((c: any) => {
        if (typeof c?.text === "string") return c.text
        if (typeof c?.content === "string") return c.content
        return ""
      })
      .join("")
      .trim()
    if (txt) return txt
  }

  return ""
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "*"

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }
  if (req.method !== "POST") return json({ error: "Use POST" }, 405, origin)

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? ""
    const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini"

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return json({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }, 500, origin)
    }
    if (!OPENAI_API_KEY) {
      return json({ error: "Missing OPENAI_API_KEY" }, 500, origin)
    }

    const body = await req.json().catch(() => ({}))
    const prompt = String(body?.prompt ?? "Gerar ações prioritárias para reduzir risco psicossocial").trim()

    // ===== BUSCA NOTES =====
    const fromDay = isoDaysAgo(7)

    type MoodNoteRow = {
      user_id: string
      day: string | null
      created_at: string | null
      score: number | null
      note: string | null
      mental_state: string | null
      work_demand: number | null
      fatigue_level: number | null
      sleep_quality: number | null
    }

    const moodNotes = await supabaseRest<MoodNoteRow[]>(
      SUPABASE_URL,
      SERVICE_ROLE_KEY,
      [
        "mood_entries?select=user_id,day,created_at,score,note,mental_state,work_demand,fatigue_level,sleep_quality",
        `&day=gte.${fromDay}`,
        "&order=created_at.desc",
        "&limit=80",
      ].join(""),
    )

    const notesForAI = moodNotes
      .filter(r => String(r.note ?? "").trim().length > 0)
      .sort((a, b) => {
        const aCrit = a.score === 1 ? 1 : 0
        const bCrit = b.score === 1 ? 1 : 0
        if (aCrit !== bCrit) return bCrit - aCrit

        const aAss = String(a.note).toLowerCase().includes("assédio") ? 1 : 0
        const bAss = String(b.note).toLowerCase().includes("assédio") ? 1 : 0
        if (aAss !== bAss) return bAss - aAss

        return new Date(b.created_at ?? "").getTime() -
               new Date(a.created_at ?? "").getTime()
      })
      .slice(0, 30)
      .map(r => ({
        user_id: r.user_id,
        day: r.day,
        score: r.score,
        note: clampText(r.note),
        mental_state: clampText(r.mental_state),
        work_demand: r.work_demand,
        fatigue_level: r.fatigue_level,
        sleep_quality: r.sleep_quality,
      }))

    const system = `
Você é especialista em saúde ocupacional.
Use obrigatoriamente os textos de recent_notes_7d.
Se aparecer "assédio", inclua ação específica.
Responda SOMENTE JSON válido conforme o schema.
    `.trim()

    const schema = {
      type: "object",
      additionalProperties: false,
      properties: {
        actions: {
          type: "array",
          maxItems: 5,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              why: { type: "string" },
              steps: { type: "array", items: { type: "string" } },
              priority: { type: "string", enum: ["Alta", "Média", "Baixa"] },
              owner_hint: { type: "string" },
            },
            required: ["title", "why", "steps", "priority", "owner_hint"],
          },
        },
      },
      required: ["actions"],
    }

    const oaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify({ prompt, recent_notes_7d: notesForAI }) },
        ],
        temperature: 0.3,
        text: {
          format: {
            type: "json_schema",
            name: "ai_actions",
            strict: true,
            schema,
          },
        },
      }),
    })

    if (!oaiRes.ok) {
      const t = await oaiRes.text()
      return json({ error: "OpenAI error", details: t }, 500, origin)
    }

    const oaiJson = await oaiRes.json()
    const raw = extractOutputText(oaiJson)

    // ✅ Se veio vazio, devolve debug em vez de quebrar
    if (!raw) {
      return json(
        {
          error: "Empty model output_text",
          details: "OpenAI returned no output_text/content. Check oaiJson in logs.",
          debug_hint: {
            has_output_text: typeof oaiJson?.output_text === "string",
            output_len: Array.isArray(oaiJson?.output) ? oaiJson.output.length : null,
          },
        },
        502,
        origin,
      )
    }

    let parsed: { actions: ActionItem[] }
    try {
      parsed = JSON.parse(raw)
    } catch {
      return json(
        { error: "Failed to parse JSON from model", raw },
        502,
        origin,
      )
    }

    return json(
      {
        ok: true,
        model: OPENAI_MODEL,
        notes_used: notesForAI.length,
        actions: parsed.actions ?? [],
      },
      200,
      origin,
    )
  } catch (e: any) {
    return json({ error: e?.message ?? String(e) }, 500, origin)
  }
})
