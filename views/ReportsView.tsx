import React, { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  Loader2,
  ChevronRight,
  FileText,
  X,
  AlertTriangle,
  Trash2,
} from "lucide-react";

import {
  fetchCycleMetrics,
  generateAiSummary,
  saveReport,
  fetchReportsList,
  fetchPreviewInsights,
  deleteReport,
  deleteAllReports,
  type CycleMetrics,
  type PreviewInsights,
} from "../services/reportsService";

import { exportElementToPDF } from "../src/utils/exportPdf";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/** utils */
function cycleKeyNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function pill(tone: "ok" | "warn" | "danger") {
  if (tone === "danger") return "bg-rose-50 text-rose-700 border-rose-100";
  if (tone === "warn") return "bg-yellow-50 text-yellow-800 border-yellow-100";
  return "bg-emerald-50 text-emerald-700 border-emerald-100";
}

function riskTone(criticalAlerts: number, burnoutAvg7d: number) {
  if (criticalAlerts >= 3 || burnoutAvg7d <= 2.2)
    return { tag: "PRIORIDADE", tone: "danger" as const };
  if (criticalAlerts >= 1 || burnoutAvg7d <= 3.0)
    return { tag: "ATENÇÃO", tone: "warn" as const };
  return { tag: "OK", tone: "ok" as const };
}

function safeNum(n: any) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

function formatAiBullets(summary: string | null) {
  if (!summary) return [];
  return summary
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => (l.startsWith("•") ? l : `• ${l}`));
}

export default function ReportsView() {
  const [cycleKey, setCycleKey] = useState(cycleKeyNow());

  const [metrics, setMetrics] = useState<CycleMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);

  const [reports, setReports] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const [insights, setInsights] = useState<PreviewInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const pdfRef = useRef<HTMLDivElement | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const [clearingHistory, setClearingHistory] = useState(false);

  const hasData = metrics?.hasData !== false;

  const tone = useMemo(() => {
    if (!metrics) return { tag: "—", tone: "ok" as const };
    return riskTone(metrics.criticalAlerts, metrics.burnoutAvg7d);
  }, [metrics]);

  const aiBullets = useMemo(
    () => formatAiBullets(metrics?.aiSummary ?? null),
    [metrics?.aiSummary]
  );

  async function loadCycle() {
    try {
      setError(null);
      setLoading(true);
      const m = await fetchCycleMetrics(cycleKey);
      setMetrics(m);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Erro ao carregar métricas do ciclo.");
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadList() {
    try {
      setListLoading(true);
      const items = await fetchReportsList();
      setReports(items);
    } catch (e: any) {
      console.error(e);
      setReports([]);
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    loadCycle();
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleKey]);

  useEffect(() => {
    if (!previewOpen) return;

    (async () => {
      try {
        setInsightsLoading(true);
        setInsights(null);
        const res = await fetchPreviewInsights(30, cycleKey);
        setInsights(res);
      } catch (e) {
        console.error(e);
        setInsights(null);
      } finally {
        setInsightsLoading(false);
      }
    })();
  }, [previewOpen, cycleKey]);

  useEffect(() => {
    if (!previewOpen) return;
    if (!metrics?.cycleKey) return;

    (async () => {
      try {
        setInsightsLoading(true);
        setInsights(null);
        const res = await fetchPreviewInsights(30, metrics.cycleKey);
        setInsights(res);
      } catch (e) {
        console.error(e);
        setInsights(null);
      } finally {
        setInsightsLoading(false);
      }
    })();
  }, [previewOpen, metrics?.cycleKey]);

  useEffect(() => {
    if (!previewOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [previewOpen]);

  async function handleGenerateReport() {
    if (!metrics || generating) return;
    if (metrics.hasData === false) return;

    try {
      setGenerating(true);
      setError(null);

      const summary = await generateAiSummary(metrics);
      const next: CycleMetrics = { ...metrics, aiSummary: summary };

      setMetrics(next);
      setPreviewOpen(true);

      await saveReport(next);
      await loadList();
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Erro ao gerar relatório IA.");
    } finally {
      setGenerating(false);
    }
  }

  function openPreviewWithReportRow(r: any) {
    const m: CycleMetrics = {
      cycleKey: String(r.cycle_key ?? ""),
      cycleLabel: String(r.cycle_label ?? ""),
      employeesAnalyzed: safeNum(r.employees_analyzed),
      criticalAlerts: safeNum(r.critical_alerts),
      burnoutAvg7d: safeNum(r.burnout_avg_7d),
      aiSummary: r.ai_summary ?? null,
      hasData: r.has_data ?? r.hasData,
    } as any;

    setMetrics(m);
    setPreviewOpen(true);
  }

  async function handleDownloadPdf() {
    if (!metrics) return;
    if (!pdfRef.current) return;

    try {
      setDownloadingPdf(true);
      await new Promise((r) => setTimeout(r, 250));

      const filename = `Relatorio-${metrics.cycleLabel}.pdf`;
      await exportElementToPDF(pdfRef.current, filename);
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function handleDeleteOne(reportId: string) {
    if (!confirm("Deseja excluir este relatório do histórico?")) return;
    try {
      await deleteReport(reportId);
      await loadList();
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Erro ao excluir relatório.");
    }
  }

  async function handleClearHistory() {
    if (!confirm("Isso vai apagar TODO o histórico de relatórios. Continuar?"))
      return;

    try {
      setClearingHistory(true);
      await deleteAllReports();
      await loadList();
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Erro ao limpar histórico.");
    } finally {
      setClearingHistory(false);
    }
  }

  const donutData = useMemo(() => {
    if (!insights?.moodDonut) return [];
    return [
      { name: "Feliz", value: safeNum(insights.moodDonut.happy) },
      { name: "Ok", value: safeNum(insights.moodDonut.ok) },
      { name: "Triste", value: safeNum(insights.moodDonut.sad) },
    ].filter((x) => x.value > 0);
  }, [insights]);

  const last7Chart = useMemo(() => {
    const src = insights?.last7 ?? [];
    if (!Array.isArray(src)) return [];
    return src.map((p: any, i: number) => ({
      day: String(p.day ?? i + 1),
      avg: safeNum(p.avgScore ?? p.avg_score ?? p.avg),
    }));
  }, [insights]);

  const PreviewModal = useMemo(() => {
    if (!previewOpen || !metrics) return null;

    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in">
          <div className="p-8 bg-[#0f172a] text-white relative">
            <button
              onClick={() => setPreviewOpen(false)}
              className="absolute right-6 top-6 p-2 rounded-xl bg-white/10 hover:bg-white/20"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            <div className="text-2xl font-black tracking-tight">
              Preview do Relatório
            </div>
            <div className="text-slate-300 text-xs mt-1 font-bold">
              {metrics.cycleLabel}
            </div>
          </div>

          <div className="max-h-[80vh] overflow-y-auto">
            <div ref={pdfRef} className="p-8 space-y-6 bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Analisados
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    {metrics.employeesAnalyzed}
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Alertas críticos
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    {metrics.criticalAlerts}
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Burnout 7d
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    {safeNum(metrics.burnoutAvg7d).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-slate-100 bg-white">
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Resumo executivo (IA)
                </div>

                {aiBullets.length ? (
                  <div className="mt-3 space-y-2">
                    {aiBullets.slice(0, 3).map((l, i) => (
                      <div
                        key={i}
                        className="text-sm font-bold text-slate-700 leading-relaxed"
                      >
                        {l}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-sm font-bold text-slate-500">
                    Ainda não gerado.
                  </div>
                )}
              </div>

              {insightsLoading ? (
                <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50 text-slate-500 font-bold">
                  Carregando insights…
                </div>
              ) : !insights ? (
                <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50 text-slate-500 font-bold">
                  Sem dados para gerar gráficos.
                </div>
              ) : (
                <>
                  {/* ✅ APENAS 2 GRÁFICOS */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl border border-slate-100 bg-white overflow-hidden">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Humor médio (7 dias)
                      </div>

                      {last7Chart.length === 0 ? (
                        <div className="h-[150px] w-full flex items-center justify-center text-slate-300 text-sm font-bold">
                          Sem dados para exibir
                        </div>
                      ) : (
                        <div className="mt-3 h-[150px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={last7Chart}
                              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                            >
                              <XAxis dataKey="day" hide />
                              <YAxis domain={[1, 5]} hide />
                              <Tooltip />
                              <defs>
                                <linearGradient
                                  id="moodFill"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="0%"
                                    stopColor="#2563eb"
                                    stopOpacity={0.25}
                                  />
                                  <stop
                                    offset="100%"
                                    stopColor="#2563eb"
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                              </defs>
                              <Area
                                type="monotone"
                                dataKey="avg"
                                stroke="#2563eb"
                                strokeWidth={3}
                                fill="url(#moodFill)"
                                dot={false}
                                isAnimationActive={false}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    <div className="p-5 rounded-2xl border border-slate-100 bg-white overflow-hidden">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Distribuição (ciclo)
                      </div>

                      <div className="mt-3 h-[150px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={
                                donutData.length
                                  ? donutData
                                  : [{ name: "Sem dados", value: 1 }]
                              }
                              dataKey="value"
                              innerRadius={42}
                              outerRadius={62}
                              paddingAngle={2}
                              stroke="none"
                              isAnimationActive={false}
                            >
                              <Cell fill="#22c55e" />
                              <Cell fill="#3b82f6" />
                              <Cell fill="#ef4444" />
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="p-6 rounded-2xl border border-slate-100 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                          Principais riscos
                        </div>
                        <div className="flex items-center gap-2 text-rose-600 text-xs font-black">
                          <AlertTriangle size={14} />
                          {safeNum(insights.criticalAlerts7d)} críticos
                        </div>
                      </div>

                      <ul className="mt-3 space-y-2 text-sm font-bold text-slate-700">
                        <li>
                          • Alertas críticos:{" "}
                          {safeNum(insights.criticalAlerts7d)}
                        </li>
                        {(insights.worstDays ?? []).slice(0, 3).map((d, i) => (
                          <li key={i}>
                            • Dia {d.day}: score médio{" "}
                            {safeNum(d.avg_score).toFixed(2)} (
                            {safeNum(d.entries)} entradas)
                          </li>
                        ))}
                        {(!insights.worstDays ||
                          insights.worstDays.length === 0) && (
                          <li>• Sem concentração de dias críticos no período.</li>
                        )}
                      </ul>
                    </div>

                    <div className="p-6 rounded-2xl border border-slate-100 bg-white">
                      <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                        Ações recomendadas (IA)
                      </div>

                      {aiBullets.length ? (
                        <div className="mt-3 space-y-2">
                          {aiBullets.slice(0, 3).map((l, i) => (
                            <div
                              key={i}
                              className="text-sm font-bold text-slate-700 leading-relaxed"
                            >
                              {l}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 text-sm font-bold text-slate-500">
                          Gere o relatório para ver as ações sugeridas.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="px-6 py-4 rounded-2xl border border-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50"
                >
                  Fechar
                </button>

                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className={[
                    "px-7 py-4 rounded-2xl bg-[#0f172a] text-white font-black text-xs uppercase tracking-widest hover:bg-blue-600 shadow-xl flex items-center gap-2",
                    downloadingPdf ? "opacity-70" : "",
                  ].join(" ")}
                >
                  {downloadingPdf ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      GERANDO…
                    </>
                  ) : (
                    "BAIXAR PDF"
                  )}
                </button>
              </div>

              <div className="text-[10px] text-slate-400 font-bold">
                * PDF gerado pelo preview (html2canvas + jsPDF).
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }, [
    previewOpen,
    metrics,
    aiBullets,
    insightsLoading,
    insights,
    donutData,
    last7Chart,
    downloadingPdf,
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-[28px] font-black text-slate-900 tracking-tight">
            Central de Relatórios
          </div>
          <div className="text-[12px] font-bold text-slate-400 mt-1">
            Extraia inteligência organizacional v1.0.
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            value={cycleKey}
            onChange={(e) => setCycleKey(e.target.value)}
            placeholder="AAAA-MM (ex: 2026-02)"
            className="px-4 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm text-sm font-bold text-slate-700 w-[220px]"
          />

          <button
            onClick={handleGenerateReport}
            disabled={loading || generating || !metrics || metrics.hasData === false}
            className={[
              "bg-[#0f172a] text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl active:scale-95 transition-all",
              loading || generating || !hasData ? "opacity-70" : "hover:bg-blue-600",
            ].join(" ")}
            title={!hasData ? "Sem dados neste ciclo" : undefined}
          >
            {generating ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Sparkles size={18} />
            )}
            GERAR RELATÓRIO IA
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50 text-rose-700 text-sm font-bold">
          {error}
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
        {loading || !metrics ? (
          <div className="flex items-center gap-3 text-slate-400 font-bold">
            <Loader2 className="animate-spin" size={18} /> Carregando métricas do ciclo…
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Relatório automático
              </div>
              <div className="text-[22px] font-black text-slate-900 mt-1">
                {metrics.cycleLabel}
              </div>

              {metrics?.hasData === false && (
                <div className="mt-4 p-4 rounded-2xl border border-slate-100 bg-slate-50 text-slate-500 font-bold">
                  Sem dados neste ciclo ({metrics.cycleLabel}). Selecione um mês com registros.
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 text-sm font-black">
                  👥 {metrics.employeesAnalyzed} analisados
                </div>
                <div className="px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 text-sm font-black">
                  ⚠ {metrics.criticalAlerts} alertas críticos
                </div>
                <div className="px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 text-slate-700 text-sm font-black">
                  🧠 Burnout 7d: {safeNum(metrics.burnoutAvg7d).toFixed(2)}
                </div>

                <div
                  className={[
                    "px-4 py-3 rounded-2xl border text-sm font-black",
                    pill(tone.tone),
                  ].join(" ")}
                >
                  {tone.tag}
                </div>
              </div>

              {aiBullets.length ? (
                <div className="mt-5 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Recomendações IA (resumo)
                  </div>
                  <div className="mt-3 space-y-2">
                    {aiBullets.slice(0, 3).map((l, i) => (
                      <div
                        key={i}
                        className="text-[12px] font-bold text-slate-700 leading-relaxed"
                      >
                        {l}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-5 text-[12px] font-bold text-slate-400">
                  Gere o relatório para ver o resumo executivo e recomendações IA.
                </div>
              )}
            </div>

            <div className="w-full lg:w-[320px] bg-[#0f172a] text-white rounded-[2rem] p-6 border border-slate-900">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                Preview
              </div>
              <div className="text-sm font-black mt-2">
                Abra o relatório antes de baixar.
              </div>
              <div className="text-xs text-slate-300 mt-2 font-bold">
                Mini-gráficos, riscos e ações recomendadas.
              </div>

              <button
                onClick={() => setPreviewOpen(true)}
                disabled={!aiBullets.length}
                className={[
                  "mt-5 w-full bg-white text-slate-900 rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2",
                  aiBullets.length ? "hover:bg-slate-100" : "opacity-50 cursor-not-allowed",
                ].join(" ")}
              >
                <FileText size={16} /> ABRIR PREVIEW <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/10 flex justify-between items-center">
          <div>
            <div className="text-xl font-black text-slate-900">Histórico de Auditoria</div>
            <div className="text-xs font-bold text-slate-400 mt-1">
              Relatórios gerados por ciclo (IA + métricas).
            </div>
          </div>

          <button
            onClick={handleClearHistory}
            disabled={clearingHistory || listLoading}
            className={[
              "px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-2",
              clearingHistory || listLoading ? "bg-slate-200 text-slate-500" : "bg-rose-600 text-white hover:bg-rose-500",
            ].join(" ")}
            title="Apagar todo o histórico"
          >
            {clearingHistory ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                LIMPANDO…
              </>
            ) : (
              <>
                <Trash2 size={16} />
                LIMPAR HISTÓRICO
              </>
            )}
          </button>
        </div>

        <div className="divide-y divide-slate-50">
          {listLoading ? (
            <div className="p-10 text-slate-400 font-bold flex items-center gap-3">
              <Loader2 className="animate-spin" size={18} /> Carregando histórico…
            </div>
          ) : reports.length === 0 ? (
            <div className="p-10 text-slate-400 font-bold">Nenhum relatório gerado ainda.</div>
          ) : (
            reports.map((r) => (
              <div
                key={r.id}
                className="p-8 flex items-center justify-between hover:bg-slate-50/40 transition-colors"
              >
                <div className="flex items-center gap-5">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <FileText size={20} />
                  </div>

                  <div>
                    <div className="font-black text-slate-900">{r.cycle_label}</div>
                    <div className="text-xs font-bold text-slate-400 mt-1">
                      👥 {safeNum(r.employees_analyzed)} • ⚠ {safeNum(r.critical_alerts)} • 🧠 {safeNum(r.burnout_avg_7d).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openPreviewWithReportRow(r)}
                    className="px-6 py-4 rounded-2xl border border-slate-100 bg-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-50"
                  >
                    ABRIR
                  </button>

                  <button
                    onClick={() => handleDeleteOne(r.id)}
                    className="p-4 rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    title="Excluir relatório"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {PreviewModal}
    </div>
  );
}
