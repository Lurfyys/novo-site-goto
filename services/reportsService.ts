import { supabase } from "./supabaseClient";
import { fetchAiActions } from "./aiActionsService";

export type CycleMetrics = {
  cycleKey: string;
  cycleLabel: string;
  employeesAnalyzed: number;
  criticalAlerts: number;
  burnoutAvg7d: number;
  aiSummary: string | null;
  hasData: boolean;
};

export type PreviewInsights = {
  last7: Array<{ day: string; avgScore: number }>;
  moodDonut: { happy: number; ok: number; sad: number } | null;
  stressBars: Array<{ name: string; Ansiedade: number; Estresse: number }>;
  criticalAlerts7d: number;
  worstDays: Array<{ day: string; avg_score: number; entries: number }>;
};

function safeNum(n: any) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

function monthLabelFromKey(cycleKey: string) {
  const [y, m] = cycleKey.split("-");
  const month = Number(m);
  const map = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  return `${map[(month ?? 1) - 1] ?? "Mês"} ${y}`;
}

function monthRangeFromCycleKey(cycleKey: string) {
  const [yStr, mStr] = cycleKey.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

function clampText(s: unknown, max = 300) {
  const t = String(s ?? "").trim();
  if (!t || t === "EMPTY") return "";
  return t.length > max ? t.slice(0, max) + "…" : t;
}

async function hasAnyDataInMonth(startISO: string, endISO: string) {
  const { count: alertsCount } = await supabase
    .from("v_global_recent_alerts")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startISO)
    .lt("created_at", endISO);

  if ((alertsCount ?? 0) > 0) return true;

  const { count: moodCount } = await supabase
    .from("mood_entries")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startISO)
    .lt("created_at", endISO);

  if ((moodCount ?? 0) > 0) return true;

  return false;
}

// ✅ NOVO: busca relatos reais do mês para enriquecer o contexto da IA
async function fetchMonthRelatos(startISO: string, endISO: string) {
  const { data } = await supabase
    .from("mood_entries")
    .select("score, note, mental_state, work_demand, fatigue_level, sleep_quality, day")
    .gte("created_at", startISO)
    .lt("created_at", endISO)
    .order("created_at", { ascending: false })
    .limit(40);

  const rows = (data ?? []) as any[];

  return rows
    .filter(r => {
      const note = clampText(r.note);
      const mental = clampText(r.mental_state);
      return note.length > 0 || mental.length > 0;
    })
    .slice(0, 20)
    .map(r => ({
      dia: r.day,
      score: r.score,
      relato: [clampText(r.note), clampText(r.mental_state)].filter(Boolean).join(" | "),
      demanda: r.work_demand,
      fadiga: r.fatigue_level,
      sono: r.sleep_quality,
    }));
}

export async function fetchCycleMetrics(cycleKey: string): Promise<CycleMetrics> {
  const cycleLabel = monthLabelFromKey(cycleKey);
  const { startISO, endISO } = monthRangeFromCycleKey(cycleKey);

  const hasData = await hasAnyDataInMonth(startISO, endISO);
  if (!hasData) {
    return { cycleKey, cycleLabel, employeesAnalyzed: 0, criticalAlerts: 0, burnoutAvg7d: 0, aiSummary: null, hasData: false };
  }

  const { count: empCount, error: empErr } = await supabase
    .from("v_company_employees_real")
    .select("*", { count: "exact", head: true });

  if (empErr) throw empErr;

  const { count: alertsCount, error: alertsErr } = await supabase
    .from("v_global_recent_alerts")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startISO)
    .lt("created_at", endISO);

  if (alertsErr) throw alertsErr;

  let burnoutAvg7d = 0;
  const { data: burnoutData } = await supabase
    .from("v_global_burnout_index_7d")
    .select("avg_score_7d, created_at")
    .gte("created_at", startISO)
    .lt("created_at", endISO)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (burnoutData?.avg_score_7d != null) {
    burnoutAvg7d = safeNum(burnoutData.avg_score_7d);
  }

  return {
    cycleKey,
    cycleLabel,
    employeesAnalyzed: empCount ?? 0,
    criticalAlerts: alertsCount ?? 0,
    burnoutAvg7d,
    aiSummary: null,
    hasData: true,
  };
}

// ✅ MELHORADO: agora busca relatos reais do mês e manda para a IA
export async function generateAiSummary(metrics: CycleMetrics): Promise<string | null> {
  const { startISO, endISO } = monthRangeFromCycleKey(metrics.cycleKey);
  const relatos = await fetchMonthRelatos(startISO, endISO);

  const relatosTexto = relatos.length > 0
    ? relatos.map((r, i) =>
        `${i + 1}. [Dia: ${r.dia ?? "?"} | Score: ${r.score}/5 | Fadiga: ${r.fadiga}/5 | Sono: ${r.sono}/5] "${r.relato}"`
      ).join("\n")
    : "Nenhum relato textual disponível neste ciclo.";

  const prompt = `
Você é especialista em saúde ocupacional e riscos psicossociais.
Gere um resumo executivo PERSONALIZADO para o relatório do ciclo ${metrics.cycleLabel}.

DADOS QUANTITATIVOS:
- Funcionários analisados: ${metrics.employeesAnalyzed}
- Alertas críticos (score=1): ${metrics.criticalAlerts}
- Média de humor 7d: ${metrics.burnoutAvg7d.toFixed(2)}/5

RELATOS REAIS DOS FUNCIONÁRIOS NESTE MÊS:
${relatosTexto}

REGRAS:
- Leia os relatos acima e baseie o resumo no que os funcionários realmente escreveram
- Se houver menção a assédio, inclua ação de suporte obrigatoriamente
- Seja direto, estilo relatório executivo para gestor de RH
- Português (BR)
- O resumo deve ser rastreável aos relatos, não genérico
`.trim();

  const actions = await fetchAiActions(prompt);
  if (!Array.isArray(actions) || actions.length === 0) return null;

  const bullets = actions.slice(0, 3).map((a: any) => {
    const title = String(a?.title ?? "").trim();
    const why = String(a?.why ?? "").trim();
    return `• ${title}${why ? ` — ${why}` : ""}`;
  });

  return bullets.join("\n");
}

export async function saveReport(metrics: CycleMetrics) {
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  const uid = authData?.user?.id;
  if (authErr || !uid) throw new Error("Sem usuário autenticado.");

  const { data, error } = await supabase
    .from("reports")
    .insert([
      {
        cycle_key: metrics.cycleKey,
        cycle_label: metrics.cycleLabel,
        employees_analyzed: metrics.employeesAnalyzed,
        critical_alerts: metrics.criticalAlerts,
        burnout_avg_7d: metrics.burnoutAvg7d,
        ai_summary: metrics.aiSummary,
        created_by: uid,
      },
    ])
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function fetchReportsList() {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

export async function fetchPreviewInsights(days: number, cycleKey?: string): Promise<PreviewInsights> {
  let startISO: string | null = null;
  let endISO: string | null = null;

  if (cycleKey) {
    const r = monthRangeFromCycleKey(cycleKey);
    startISO = r.startISO;
    endISO = r.endISO;

    const has = await hasAnyDataInMonth(startISO, endISO);
    if (!has) {
      return {
        last7: [],
        moodDonut: null,
        stressBars: [
          { name: "Sem", Ansiedade: 0, Estresse: 0 },
          { name: "Mod.", Ansiedade: 0, Estresse: 0 },
          { name: "Alto", Ansiedade: 0, Estresse: 0 },
        ],
        criticalAlerts7d: 0,
        worstDays: [],
      };
    }
  }

  const last7 = await (async () => {
    let q = supabase
      .from("mood_entries")
      .select("score, created_at, day")
      .order("created_at", { ascending: true });

    if (startISO && endISO) {
      q = q.gte("created_at", startISO).lt("created_at", endISO);
    } else {
      const since = new Date();
      since.setDate(since.getDate() - Math.max(1, days));
      q = q.gte("created_at", since.toISOString());
    }

    const { data } = await q;
    const rows = (data ?? []) as any[];
    if (!rows.length) return [];

    const map = new Map<string, { sum: number; n: number }>();
    for (const r of rows) {
      const score = safeNum(r.score);
      if (!(score >= 1 && score <= 5)) continue;
      const dayKey = (r.day ? String(r.day).slice(0, 10) : null) ?? String(r.created_at).slice(0, 10);
      const cur = map.get(dayKey) ?? { sum: 0, n: 0 };
      cur.sum += score;
      cur.n += 1;
      map.set(dayKey, cur);
    }

    return Array.from(map.entries())
      .map(([day, v]) => ({ day, avgScore: v.n ? v.sum / v.n : 0 }))
      .filter((x) => x.avgScore > 0)
      .sort((a, b) => a.day.localeCompare(b.day))
      .slice(-7);
  })();

  const moodDonut = await (async () => {
    let q = supabase.from("mood_entries").select("score, created_at");
    if (startISO && endISO) q = q.gte("created_at", startISO).lt("created_at", endISO);
    const { data } = await q;
    const rows = (data ?? []) as any[];
    if (!rows.length) return null;
    let happy = 0, ok = 0, sad = 0;
    for (const r of rows) {
      const s = safeNum(r.score);
      if (s >= 4) happy++;
      else if (s === 3) ok++;
      else if (s > 0) sad++;
    }
    return { happy, ok, sad };
  })();

  const stressBars = [
    { name: "Sem", Ansiedade: 0, Estresse: 0 },
    { name: "Mod.", Ansiedade: 0, Estresse: 0 },
    { name: "Alto", Ansiedade: 0, Estresse: 0 },
  ];

  const criticalAlerts7d = await (async () => {
    const q = supabase.from("v_global_recent_alerts").select("*", { count: "exact", head: true });
    const q2 = startISO && endISO ? q.gte("created_at", startISO).lt("created_at", endISO) : q;
    const { count } = await q2;
    return count ?? 0;
  })();

  const worstDays = await (async () => {
    const q = supabase
      .from("v_alerts_worst_days")
      .select("day, avg_score, entries")
      .order("avg_score", { ascending: true })
      .limit(3);
    const q2 = startISO && endISO ? q.gte("day", startISO).lt("day", endISO) : q;
    const { data } = await q2;
    return (data ?? []).map((d: any) => ({
      day: String(d.day).slice(0, 10),
      avg_score: safeNum(d.avg_score),
      entries: safeNum(d.entries),
    }));
  })();

  return { last7, moodDonut, stressBars, criticalAlerts7d, worstDays };
}

export async function deleteReport(reportId: string) {
  const { error } = await supabase.from("reports").delete().eq("id", reportId);
  if (error) throw error;
}

export async function deleteAllReports() {
  const { error } = await supabase
    .from("reports")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw error;
}