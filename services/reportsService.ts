import { supabase } from "./supabaseClient";
import { fetchAiActions } from "./aiActionsService";

export type CycleMetrics = {
  cycleKey: string; // "2026-02"
  cycleLabel: string; // "Fevereiro 2026"
  employeesAnalyzed: number;
  criticalAlerts: number;
  burnoutAvg7d: number;
  aiSummary: string | null;
  hasData: boolean; // ✅ se existe dado nesse ciclo
};

export type PreviewInsights = {
  last7: Array<{ day: string; avgScore: number }>;
  moodDonut: { happy: number; ok: number; sad: number } | null;

  // ✅ não vamos usar mais no UI, mas mantemos no contrato pra não quebrar
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
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return `${map[(month ?? 1) - 1] ?? "Mês"} ${y}`;
}

function monthRangeFromCycleKey(cycleKey: string) {
  const [yStr, mStr] = cycleKey.split("-");
  const y = Number(yStr);
  const m = Number(mStr);

  // [start, end) do mês em UTC
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0));

  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

/**
 * ✅ Define “tem dados no mês” olhando tabelas reais.
 */
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

export async function fetchCycleMetrics(cycleKey: string): Promise<CycleMetrics> {
  const cycleLabel = monthLabelFromKey(cycleKey);
  const { startISO, endISO } = monthRangeFromCycleKey(cycleKey);

  const hasData = await hasAnyDataInMonth(startISO, endISO);
  if (!hasData) {
    return {
      cycleKey,
      cycleLabel,
      employeesAnalyzed: 0,
      criticalAlerts: 0,
      burnoutAvg7d: 0,
      aiSummary: null,
      hasData: false,
    };
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

export async function generateAiSummary(metrics: CycleMetrics): Promise<string | null> {
  const prompt = `
Você é um especialista em riscos psicossociais no trabalho.
Gere um resumo executivo (no máximo 3 bullets) para um relatório mensal.

Dados do ciclo:
- Ciclo: ${metrics.cycleLabel}
- Funcionários analisados: ${metrics.employeesAnalyzed}
- Alertas críticos: ${metrics.criticalAlerts}
- Burnout médio 7d: ${metrics.burnoutAvg7d.toFixed(2)}

Regras:
- Português (BR)
- Direto, estilo gestor
- Inclua 1 recomendação prática
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

/**
 * ✅ Preview do relatório filtrado pelo mês (cycleKey)
 * ✅ last7 calculado direto de mood_entries (não depende de view)
 */
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

  // ✅ last7 (média por dia calculada do mood_entries)
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

      const dayKey =
        (r.day ? String(r.day).slice(0, 10) : null) ??
        String(r.created_at).slice(0, 10);

      const cur = map.get(dayKey) ?? { sum: 0, n: 0 };
      cur.sum += score;
      cur.n += 1;
      map.set(dayKey, cur);
    }

    const arr = Array.from(map.entries())
      .map(([day, v]) => ({ day, avgScore: v.n ? v.sum / v.n : 0 }))
      .filter((x) => x.avgScore > 0)
      .sort((a, b) => a.day.localeCompare(b.day));

    return arr.slice(-7);
  })();

  // ✅ donut por ciclo (mood_entries)
  const moodDonut = await (async () => {
    let q = supabase.from("mood_entries").select("score, created_at");
    if (startISO && endISO) q = q.gte("created_at", startISO).lt("created_at", endISO);

    const { data } = await q;
    const rows = (data ?? []) as any[];
    if (!rows.length) return null;

    let happy = 0,
      ok = 0,
      sad = 0;

    for (const r of rows) {
      const s = safeNum(r.score);
      if (s >= 4) happy++;
      else if (s === 3) ok++;
      else if (s > 0) sad++;
    }
    return { happy, ok, sad };
  })();

  // ✅ mantém stressBars só pra compatibilidade (não usado no UI)
  const stressBars = [
    { name: "Sem", Ansiedade: 0, Estresse: 0 },
    { name: "Mod.", Ansiedade: 0, Estresse: 0 },
    { name: "Alto", Ansiedade: 0, Estresse: 0 },
  ];

  // ✅ criticalAlerts7d
  const criticalAlerts7d = await (async () => {
    const q = supabase
      .from("v_global_recent_alerts")
      .select("*", { count: "exact", head: true });

    const q2 =
      startISO && endISO ? q.gte("created_at", startISO).lt("created_at", endISO) : q;

    const { count } = await q2;
    return count ?? 0;
  })();

  // worst days (mantém como estava)
  const worstDays = await (async () => {
    const q = supabase
      .from("v_alerts_worst_days")
      .select("day, avg_score, entries")
      .order("avg_score", { ascending: true })
      .limit(3);

    const q2 =
      startISO && endISO ? q.gte("day", startISO).lt("day", endISO) : q;

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
