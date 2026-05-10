// NR1(WEB) → views/SurveyResponsesView.tsx
// Substitui o arquivo inteiro
// Agora exibe dados AGREGADOS por empresa/ciclo.
// Nenhum dado individual é mostrado — alinhado com COPSOQ e NR-01.

import React, { useEffect, useMemo, useState } from 'react'
import {
  fetchSurveyQuestionMap,
  fetchSurveyResponses,
  type SurveyQuestionMapRow,
  type SurveyAggregatedRow,
} from '../services/reports2Service'
import { Calendar, ShieldCheck, AlertTriangle, Info, Users } from 'lucide-react'

function formatMonthLabel(ym: string) {
  if (!ym || ym.length < 7) return ym
  const [y, m] = ym.split('-')
  const date = new Date(Number(y), Number(m) - 1, 1)
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function riskBar(pct: number, color: string) {
  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  )
}

export default function SurveyResponsesView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<SurveyAggregatedRow[]>([])
  const [_map, setMap] = useState<SurveyQuestionMapRow[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setError(null)
        setLoading(true)
        const [qm, resp] = await Promise.all([fetchSurveyQuestionMap(), fetchSurveyResponses()])
        if (!mounted) return
        setMap(qm)
        setRows(resp)
        const months = Array.from(new Set(resp.map((r) => r.month_key).filter(Boolean))).sort(
          (a, b) => b.localeCompare(a)
        )
        setSelectedMonth(months[0] ?? new Date().toISOString().slice(0, 7))
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message ?? 'Erro ao carregar respostas.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const monthOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.month_key).filter(Boolean))
    const arr = Array.from(set).sort((a, b) => b.localeCompare(a))
    if (arr.length === 0) arr.push(new Date().toISOString().slice(0, 7))
    return arr
  }, [rows])

  const filteredRows = useMemo(
    () => rows.filter((r) => r.month_key === selectedMonth),
    [rows, selectedMonth]
  )

  const totals = useMemo(() => {
    const visible = filteredRows.filter((r) => !r.anonymity_blocked)
    if (visible.length === 0) return null
    const totalResp = visible.reduce((a, b) => a + b.response_count, 0)
    const avgScore = visible.reduce((a, b) => a + b.avg_score * b.response_count, 0) / totalResp
    const pctAlto = visible.reduce((a, b) => a + b.pct_alto * b.response_count, 0) / totalResp
    const pctAtencao = visible.reduce((a, b) => a + b.pct_atencao * b.response_count, 0) / totalResp
    const pctBaixo = visible.reduce((a, b) => a + b.pct_baixo * b.response_count, 0) / totalResp
    return { totalResp, avgScore, pctAlto, pctAtencao, pctBaixo }
  }, [filteredRows])

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[26px] font-black text-slate-900">Resultados COPSOQ / NR-01</div>
          <div className="text-[12px] font-bold text-slate-400 mt-1">
            Dados agregados por empresa · respostas individuais nunca são exibidas
          </div>
        </div>

        <div className="px-4 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
            <Calendar size={18} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ciclo</div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-[12px] font-black text-slate-900 bg-transparent outline-none cursor-pointer"
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>{formatMonthLabel(m)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* AVISO DE ANONIMATO */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 mt-0.5">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="text-[13px] font-black text-slate-900">Dados anonimizados</div>
            <div className="text-[11px] font-bold text-slate-500 mt-1 leading-relaxed">
              As respostas individuais nunca são armazenadas com identificação pessoal.
              O sistema usa pseudonimização irreversível (SHA-256) e exibe apenas médias agregadas por empresa.
              Ciclos com menos de <span className="text-slate-800 font-black">5 respostas</span> são bloqueados
              automaticamente para proteger o anonimato.
            </div>
          </div>
        </div>
      </div>

      {/* LEGENDA DE RISCO */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 mt-0.5">
            <Info size={18} />
          </div>
          <div className="text-[13px] font-black text-slate-900">Como interpretar o risco</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700">BAIXO</div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="text-[11px] font-bold text-emerald-800">Média ≤ 2.8 · sem sinais relevantes.</div>
          </div>
          <div className="p-4 rounded-2xl border border-yellow-100 bg-yellow-50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-yellow-800">ATENÇÃO</div>
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
            </div>
            <div className="text-[11px] font-bold text-yellow-900">Média 2.8–3.8 · investigar fatores.</div>
          </div>
          <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-rose-700">ALTO</div>
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            </div>
            <div className="text-[11px] font-bold text-rose-800">Média &gt; 3.8 · ação e plano de mitigação.</div>
          </div>
        </div>
      </div>

      {/* SUMÁRIO DO CICLO */}
      {totals && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-6">
          <div className="text-[13px] font-black text-slate-900 mb-4">
            Resumo do ciclo — {formatMonthLabel(selectedMonth)}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Respostas</div>
              <div className="text-[22px] font-black text-slate-900">{totals.totalResp}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Score médio</div>
              <div className="text-[22px] font-black text-slate-900">{totals.avgScore.toFixed(1)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
              <div className="text-[10px] font-black uppercase tracking-widest text-rose-700 mb-1">% Alto risco</div>
              <div className="text-[22px] font-black text-rose-700">{totals.pctAlto.toFixed(0)}%</div>
            </div>
            <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-100">
              <div className="text-[10px] font-black uppercase tracking-widest text-yellow-800 mb-1">% Atenção</div>
              <div className="text-[22px] font-black text-yellow-800">{totals.pctAtencao.toFixed(0)}%</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl border border-red-100 bg-red-50 text-red-700 text-sm font-bold">{error}</div>
      )}

      {/* LISTA POR EMPRESA */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[13px] font-bold text-slate-700">Por empresa — {formatMonthLabel(selectedMonth)}</div>
            <div className="text-[11px] font-bold text-slate-400 mt-1">
              {filteredRows.filter((r) => !r.anonymity_blocked).length} empresa(s) com dados suficientes
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-slate-400 text-sm font-bold text-center py-12">Carregando…</div>
        ) : filteredRows.length === 0 ? (
          <div className="text-slate-300 text-sm font-bold text-center py-12">Sem dados neste ciclo.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRows.map((r) => {
              if (r.anonymity_blocked) {
                return (
                  <div key={`${r.company_id}-${r.month_key}`} className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <Users size={18} className="text-slate-400" />
                      </div>
                      <div>
                        <div className="text-[12px] font-black text-slate-400">Empresa — ID parcial: {r.company_id.slice(0, 8)}…</div>
                        <div className="flex items-center gap-2 mt-1">
                          <AlertTriangle size={12} className="text-amber-500" />
                          <span className="text-[11px] font-bold text-amber-600">
                            {r.response_count} resposta(s) — mínimo 5 para exibir (proteção de anonimato)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div key={`${r.company_id}-${r.month_key}`} className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-11 w-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                        <Users size={18} className="text-slate-600" />
                      </div>
                      <div>
                        <div className="text-[12px] font-black text-slate-500">
                          Empresa ID: {r.company_id.slice(0, 8)}…
                        </div>
                        <div className="text-[11px] font-bold text-slate-400 mt-0.5">
                          {r.response_count} respostas · Score médio: {r.avg_score}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] font-bold text-slate-500 mb-1">Distribuição de risco</div>
                      <div className="flex items-center gap-2 text-[10px] font-black">
                        <span className="text-rose-600">{r.pct_alto}% alto</span>
                        <span className="text-yellow-700">{r.pct_atencao}% atenção</span>
                        <span className="text-emerald-600">{r.pct_baixo}% baixo</span>
                      </div>
                    </div>
                  </div>

                  {/* Barras de risco */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black uppercase text-rose-600 w-14">Alto</span>
                      {riskBar(r.pct_alto, 'bg-rose-400')}
                      <span className="text-[10px] font-black text-rose-600 w-8 text-right">{r.pct_alto}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black uppercase text-yellow-700 w-14">Atenção</span>
                      {riskBar(r.pct_atencao, 'bg-yellow-400')}
                      <span className="text-[10px] font-black text-yellow-700 w-8 text-right">{r.pct_atencao}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black uppercase text-emerald-600 w-14">Baixo</span>
                      {riskBar(r.pct_baixo, 'bg-emerald-400')}
                      <span className="text-[10px] font-black text-emerald-600 w-8 text-right">{r.pct_baixo}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="text-center text-[10px] text-slate-300 pb-4">
        Instrumento: COPSOQ – Versão Curta (Portugal, 2013) · COPSOQ International Network ·
        Anonimização conforme LGPD e NR-01
      </div>
    </div>
  )
}