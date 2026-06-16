// NR1(WEB) → views/SurveyResponsesView.tsx

import React, { useEffect, useMemo, useState } from 'react'
import {
  fetchSurveyQuestionMap,
  fetchSurveyResponses,
  type SurveyAggregatedRow,
} from '../services/reports2Service'
import { Calendar, ShieldCheck, Info, Users } from 'lucide-react'

function formatMonthLabel(ym: string) {
  if (!ym || ym.length < 7) return ym
  const [y, m] = ym.split('-')
  const date = new Date(Number(y), Number(m) - 1, 1)
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// ── Categorias COPSOQ ─────────────────────────────────────────

const COPSOQ_CATEGORIES = [
  { key: 'avg_exigencias_trabalho',      label: 'Exigências do Trabalho'    },
  { key: 'avg_organizacao_conteudo',     label: 'Organização e Conteúdo'    },
  { key: 'avg_relacoes_lideranca',       label: 'Relações e Liderança'      },
  { key: 'avg_valores_trabalho',         label: 'Valores no Trabalho'       },
  { key: 'avg_inseguranca_laboral',      label: 'Insegurança Laboral'       },
  { key: 'avg_saude_geral',             label: 'Saúde Geral'               },
  { key: 'avg_trabalho_vida_pessoal',    label: 'Trabalho vs Vida Pessoal'  },
  { key: 'avg_saude_4semanas',           label: 'Saúde 4 Semanas'           },
  { key: 'avg_comportamentos_ofensivos', label: 'Comportamentos Ofensivos'  },
] as const

function buildRadarData(row: SurveyAggregatedRow) {
  return COPSOQ_CATEGORIES.map(({ key, label }) => ({
    label,
    value: (row[key as keyof SurveyAggregatedRow] as number | null) ?? 0,
    hasData: row[key as keyof SurveyAggregatedRow] != null,
  }))
}

function riskColor(value: number) {
  if (value > 3.8) return { stroke: '#f43f5e', fill: 'rgba(244,63,94,0.15)', dot: '#f43f5e', bar: 'bg-rose-400', text: 'text-rose-600' }
  if (value > 2.8) return { stroke: '#eab308', fill: 'rgba(234,179,8,0.15)',  dot: '#eab308', bar: 'bg-yellow-400', text: 'text-yellow-700' }
  return           { stroke: '#10b981', fill: 'rgba(16,185,129,0.15)',         dot: '#10b981', bar: 'bg-emerald-400', text: 'text-emerald-600' }
}

// ── Radar Chart SVG ───────────────────────────────────────────

interface RadarPoint { label: string; value: number; hasData: boolean }

function RadarChart({ data, size = 420 }: { data: RadarPoint[]; size?: number }) {
  if (!data || data.length < 3) return null

  const padding = 90  // espaço para labels nas bordas
  const cx = size / 2
  const cy = size / 2
  const radius = (size - padding * 2) / 2
  const levels = 5
  const n = data.length
  const maxVal = 5

  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n

  const toXY = (i: number, val: number) => {
    const r = (val / maxVal) * radius
    return { x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) }
  }

  const hasAnyData = data.some(d => d.hasData)

  // Cor dominante baseada na média geral
  const avgVal = hasAnyData
    ? data.filter(d => d.hasData).reduce((s, d) => s + d.value, 0) / data.filter(d => d.hasData).length
    : 3
  const colors = riskColor(avgVal)

  // Grid
  const gridPolygons = Array.from({ length: levels }, (_, l) => {
    const pts = Array.from({ length: n }, (_, i) => {
      const r = ((l + 1) / levels) * radius
      return `${cx + r * Math.cos(angle(i))},${cy + r * Math.sin(angle(i))}`
    }).join(' ')
    return (
      <polygon
        key={l}
        points={pts}
        fill={l % 2 === 0 ? 'rgba(248,250,252,0.8)' : 'rgba(255,255,255,0.8)'}
        stroke="#e2e8f0"
        strokeWidth="1"
      />
    )
  })

  // Eixos
  const axes = Array.from({ length: n }, (_, i) => {
    const end = toXY(i, maxVal)
    return (
      <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y}
        stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4,3" />
    )
  })

  // Nível labels (1-5) no eixo de cima
  const levelLabels = Array.from({ length: levels }, (_, l) => {
    const r = ((l + 1) / levels) * radius
    return (
      <text key={l} x={cx + 5} y={cy - r + 4}
        fontSize="9" fill="#94a3b8" fontFamily="Inter, sans-serif" fontWeight="600">
        {l + 1}
      </text>
    )
  })

  // Polígono dos dados
  const polyPoints = data.map((d, i) => {
    const pt = toXY(i, d.hasData ? Math.max(0.1, Math.min(d.value, maxVal)) : 0)
    return `${pt.x},${pt.y}`
  }).join(' ')

  // Labels externos — posicionados com mais espaço
  const labelEls = data.map((d, i) => {
    const a = angle(i)
    const labelR = radius + 28
    const x = cx + labelR * Math.cos(a)
    const y = cy + labelR * Math.sin(a)

    // Quebra label em palavras, máx 2 por linha
    const words = d.label.split(' ')
    const lines: string[] = []
    for (let w = 0; w < words.length; w += 2) {
      lines.push(words.slice(w, w + 2).join(' '))
    }

    const lineH = 11
    const totalH = lines.length * lineH
    const startDy = -totalH / 2 + lineH / 2

    const c = d.hasData ? riskColor(d.value) : { text: 'text-slate-400' }
    const fillColor = d.hasData
      ? d.value > 3.8 ? '#f43f5e' : d.value > 2.8 ? '#ca8a04' : '#059669'
      : '#94a3b8'

    return (
      <text key={i} textAnchor="middle" fontSize="9.5" fontWeight="800"
        fill={fillColor} fontFamily="Inter, sans-serif">
        {lines.map((line, li) => (
          <tspan key={li} x={x} y={y + startDy + li * lineH}>{line}</tspan>
        ))}
      </text>
    )
  })

  // Pontos com valor
  const dots = data.map((d, i) => {
    if (!d.hasData) return null
    const pt = toXY(i, Math.max(0.1, Math.min(d.value, maxVal)))
    const c = riskColor(d.value)
    return (
      <g key={i}>
        <circle cx={pt.x} cy={pt.y} r="6" fill={c.dot} stroke="white" strokeWidth="2.5" />
        {/* Valor em tooltip inline — pequeno badge */}
        <text x={pt.x} y={pt.y - 10} textAnchor="middle" fontSize="8" fontWeight="800"
          fill={c.dot} fontFamily="Inter, sans-serif">
          {d.value.toFixed(1)}
        </text>
      </g>
    )
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {gridPolygons}
      {axes}
      {levelLabels}
      {hasAnyData && (
        <polygon
          points={polyPoints}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeOpacity="0.9"
        />
      )}
      {dots}
      {labelEls}
    </svg>
  )
}

// ── View principal ────────────────────────────────────────────

export default function SurveyResponsesView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<SurveyAggregatedRow[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setError(null)
        setLoading(true)
        const [, resp] = await Promise.all([fetchSurveyQuestionMap(), fetchSurveyResponses()])
        if (!mounted) return
        setRows(resp)
        const months = Array.from(new Set(resp.map((r) => r.month_key).filter(Boolean))).sort((a, b) => b.localeCompare(a))
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

  const visibleRows = useMemo(
    () => rows.filter((r) => r.month_key === selectedMonth && !r.anonymity_blocked),
    [rows, selectedMonth]
  )

  const totals = useMemo(() => {
    if (visibleRows.length === 0) return null
    const totalResp = visibleRows.reduce((a, b) => a + b.response_count, 0)
    const avgScore = visibleRows.reduce((a, b) => a + b.avg_score * b.response_count, 0) / totalResp
    const pctAlto = visibleRows.reduce((a, b) => a + b.pct_alto * b.response_count, 0) / totalResp
    const pctAtencao = visibleRows.reduce((a, b) => a + b.pct_atencao * b.response_count, 0) / totalResp
    return { totalResp, avgScore, pctAlto, pctAtencao }
  }, [visibleRows])

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[26px] font-black text-slate-900">Resultados COPSOQ / NR-01</div>
          <div className="text-[12px] font-bold text-slate-400 mt-1">
            Dados agregados · respostas individuais nunca são exibidas
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
              Ciclos com menos de <span className="text-slate-800 font-black">5 respostas</span> são bloqueados automaticamente.
            </div>
          </div>
        </div>
      </div>

      {/* LEGENDA */}
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

      {/* SUMÁRIO */}
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

      {/* RESULTADOS */}
      {loading ? (
        <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-12 text-center text-slate-400 text-sm font-bold">
          Carregando…
        </div>
      ) : visibleRows.length === 0 ? (
        <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-12 text-center text-slate-300 text-sm font-bold">
          {rows.length === 0
            ? 'Sem dados para este ciclo.'
            : 'Mínimo de 5 respostas não atingido — dados ocultados para proteger o anonimato.'}
        </div>
      ) : (
        visibleRows.map((r) => {
          const radarData = buildRadarData(r)
          const hasRealData = radarData.some(d => d.hasData)

          return (
            <div key={`${r.company_id}-${r.month_key}`} className="bg-white border border-slate-100 shadow-sm rounded-[2rem] overflow-hidden">
              {/* Cabeçalho */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                    <Users size={18} className="text-slate-600" />
                  </div>
                  <div>
                    <div className="text-[13px] font-black text-slate-800">
                      {r.response_count} respostas · Score médio: {r.avg_score}
                    </div>
                    <div className="text-[11px] font-bold text-slate-400 mt-0.5">
                      {formatMonthLabel(r.month_key)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-black">
                  <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100">{r.pct_alto}% alto</span>
                  <span className="px-3 py-1 rounded-full bg-yellow-50 text-yellow-800 border border-yellow-100">{r.pct_atencao}% atenção</span>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">{r.pct_baixo}% baixo</span>
                </div>
              </div>

              {/* Gráfico */}
              <div className="p-6">
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">
                  Perfil por domínio COPSOQ
                </div>

                {!hasRealData && (
                  <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 text-[11px] font-bold text-amber-700">
                    ⚠️ Estas respostas foram coletadas antes da atualização do sistema. O gráfico por categoria estará disponível nos próximos ciclos.
                  </div>
                )}

                {/* Layout: radar + barras lado a lado */}
                <div className="flex flex-col xl:flex-row items-start gap-8">
                  {/* Radar */}
                  <div className="flex-shrink-0 flex items-center justify-center w-full xl:w-auto">
                    <RadarChart data={radarData} size={420} />
                  </div>

                  {/* Barras detalhadas */}
                  <div className="flex-1 w-full space-y-3">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                      Score por dimensão (escala 1–5)
                    </div>
                    {radarData.map((d) => {
                      const c = riskColor(d.value)
                      const riskLabel = d.value > 3.8 ? 'ALTO' : d.value > 2.8 ? 'ATENÇÃO' : 'BAIXO'
                      const riskBadge = d.value > 3.8
                        ? 'bg-rose-50 text-rose-700 border-rose-100'
                        : d.value > 2.8
                        ? 'bg-yellow-50 text-yellow-800 border-yellow-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'

                      return (
                        <div key={d.label} className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-black text-slate-700">{d.label}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              {d.hasData && (
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${riskBadge}`}>
                                  {riskLabel}
                                </span>
                              )}
                              <span className="text-[12px] font-black text-slate-800 w-8 text-right">
                                {d.hasData ? d.value.toFixed(1) : '—'}
                              </span>
                            </div>
                          </div>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            {d.hasData && (
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${c.bar}`}
                                style={{ width: `${(d.value / 5) * 100}%` }}
                              />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        })
      )}

      <div className="text-center text-[10px] text-slate-300 pb-4">
        Instrumento: COPSOQ – Versão Curta (Portugal, 2013) · COPSOQ International Network ·
        Anonimização conforme LGPD e NR-01
      </div>
    </div>
  )
}