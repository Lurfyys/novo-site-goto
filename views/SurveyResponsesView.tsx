import React, { useEffect, useMemo, useState } from 'react'
import {
  fetchSurveyQuestionMap,
  fetchSurveyResponses,
  fetchProfilesByUserIds,
  pickBestProfileName,
  type SurveyQuestionMapRow,
  type SurveyResponseRow,
  type ProfileMiniRow
} from '../services/reports2Service'
import { Calendar, Search, ChevronRight, X, User, Info } from 'lucide-react'

function monthKeyFromISO(date?: string | null) {
  if (!date) return ''
  return String(date).slice(0, 7)
}

function formatMonthLabel(ym: string) {
  if (!ym || ym.length < 7) return ym
  const [y, m] = ym.split('-')
  const date = new Date(Number(y), Number(m) - 1, 1)
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function riskPill(risk: string) {
  const base = 'text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border'
  if (risk === 'alto') return `${base} bg-rose-50 text-rose-700 border-rose-100`
  if (risk === 'atencao') return `${base} bg-yellow-50 text-yellow-800 border-yellow-100`
  return `${base} bg-emerald-50 text-emerald-700 border-emerald-100`
}

function riskDot(risk: string) {
  if (risk === 'alto') return 'bg-rose-500'
  if (risk === 'atencao') return 'bg-yellow-500'
  return 'bg-emerald-500'
}

function initials(name: string) {
  const parts = (name || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)

  if (parts.length === 0) return '—'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function literalAnswer(value: number | null) {
  if (value === 1) return 'Nunca'
  if (value === 2) return 'Raramente'
  if (value === 3) return 'Às vezes'
  if (value === 4) return 'Frequentemente'
  if (value === 5) return 'Sempre'
  return '—'
}

function normalizeAnswerValue(v: any): number | null {
  if (v == null) return null
  if (typeof v === 'number') return v
  if (typeof v === 'object' && typeof v.value === 'number') return v.value
  return null
}

export default function SurveyResponsesView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [rows, setRows] = useState<SurveyResponseRow[]>([])
  const [map, setMap] = useState<SurveyQuestionMapRow[]>([])
  const [profiles, setProfiles] = useState<ProfileMiniRow[]>([])

  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [nameFilter, setNameFilter] = useState<string>('')

  const [selected, setSelected] = useState<SurveyResponseRow | null>(null)

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

        const months = Array.from(new Set((resp ?? []).map(r => monthKeyFromISO(r.date)).filter(Boolean))).sort((a, b) =>
          b.localeCompare(a)
        )
        setSelectedMonth(months[0] ?? new Date().toISOString().slice(0, 7))

        const ids = (resp ?? []).map(r => r.user_id)
        const prof = await fetchProfilesByUserIds(ids)
        if (!mounted) return
        setProfiles(prof)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message ?? 'Erro ao carregar respostas.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const profileMap = useMemo(() => {
    const m = new Map<string, ProfileMiniRow>()
    for (const p of profiles ?? []) if (p?.user_id) m.set(p.user_id, p)
    return m
  }, [profiles])

  const monthOptions = useMemo(() => {
    const set = new Set<string>()
    for (const r of rows) {
      const k = monthKeyFromISO(r.date)
      if (k) set.add(k)
    }
    const arr = Array.from(set).sort((a, b) => b.localeCompare(a))
    if (arr.length === 0) arr.push(new Date().toISOString().slice(0, 7))
    return arr
  }, [rows])

  const filteredRows = useMemo(() => {
    const m = selectedMonth
    const q = nameFilter.trim().toLowerCase()

    return rows.filter(r => {
      const okMonth = !m ? true : monthKeyFromISO(r.date) === m
      if (!okMonth) return false
      if (!q) return true

      const p = profileMap.get(r.user_id)
      const name = pickBestProfileName(p).toLowerCase()
      return name.includes(q)
    })
  }, [rows, selectedMonth, nameFilter, profileMap])

  const detailItems = useMemo(() => {
    if (!selected) return []
    const answers = selected.answers ?? {}

    const ordered = (map ?? []).map(q => {
      const raw = answers?.[q.slug_key]
      const value = normalizeAnswerValue(raw)
      return {
        q_key: q.q_key,
        label: q.label || q.slug_key,
        value,
        literal: literalAnswer(value)
      }
    })

    const extraKeys = Object.keys(answers ?? {}).filter(
      k => k !== '__format' && !(map ?? []).some(m => m.slug_key === k)
    )

    const extras = extraKeys.map(k => {
      const raw = answers?.[k]
      const value = normalizeAnswerValue(raw)
      return { q_key: 'extra', label: k, value, literal: literalAnswer(value) }
    })

    return [...ordered, ...extras]
  }, [selected, map])

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[26px] font-black text-slate-900">Respostas do Questionário (NR-01)</div>
          <div className="text-[12px] font-bold text-slate-400 mt-1">
            Avaliações por ciclo • detalhe pergunta a pergunta • resposta literal.
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
              onChange={e => setSelectedMonth(e.target.value)}
              className="text-[12px] font-black text-slate-900 bg-transparent outline-none cursor-pointer"
            >
              {monthOptions.map(m => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ✅ LEGENDA / INTERPRETAÇÃO */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 mt-0.5">
            <Info size={18} />
          </div>

          <div className="min-w-0">
            <div className="text-[13px] font-black text-slate-900">Como interpretar o “Risco”</div>
            <div className="text-[11px] font-bold text-slate-500 mt-1 leading-relaxed">
              O sistema classifica cada avaliação em três níveis com base na <span className="text-slate-800">média</span> das respostas
              (1 a 5). No seu app, a regra está assim:
              <span className="block mt-1 text-slate-600">
                • <span className="font-black">ALTO</span>: média &gt; 3.8 • <span className="font-black">ATENÇÃO</span>: média &gt; 2.8 • <span className="font-black">BAIXO</span>: demais casos
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700">BAIXO</div>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </div>
                <div className="text-[11px] font-bold text-emerald-800 mt-2">
                  Sem sinais relevantes no ciclo. Acompanhar normalmente.
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-yellow-100 bg-yellow-50">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black uppercase tracking-widest text-yellow-800">ATENÇÃO</div>
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                </div>
                <div className="text-[11px] font-bold text-yellow-900 mt-2">
                  Sinais moderados. Recomenda-se acompanhar e investigar fatores do ambiente.
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black uppercase tracking-widest text-rose-700">ALTO</div>
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                </div>
                <div className="text-[11px] font-bold text-rose-800 mt-2">
                  Prioridade. Recomenda-se ação e plano de mitigação (monitorar suporte, demanda, liderança etc.).
                </div>
              </div>
            </div>

            <div className="text-[10px] font-bold text-slate-400 mt-3">
              Obs: se você quiser “alto” representar piora (mais comum), dá pra inverter a regra depois sem mexer na tela.
            </div>
          </div>
        </div>
      </div>

      {/* FILTRO POR NOME */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
            <Search size={18} />
          </div>
          <input
            value={nameFilter}
            onChange={e => setNameFilter(e.target.value)}
            placeholder="Filtrar por nome (ex: lucas, julia, gustavo...)"
            className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 text-sm font-bold text-slate-700 outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-red-100 bg-red-50 text-red-700 text-sm font-bold">{error}</div>
      )}

      {/* LISTA */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-[2rem] overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[13px] font-bold text-slate-700">Avaliações do ciclo</div>
            <div className="text-[11px] font-bold text-slate-400 mt-1">Total: {filteredRows.length}</div>
          </div>

          <div className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
            {formatMonthLabel(selectedMonth || monthOptions[0] || '')}
          </div>
        </div>

        {loading ? (
          <div className="text-slate-400 text-sm font-bold text-center py-12">Carregando…</div>
        ) : filteredRows.length === 0 ? (
          <div className="text-slate-300 text-sm font-bold text-center py-12">Sem avaliações neste filtro.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRows.map(r => {
              const p = profileMap.get(r.user_id)
              const name = pickBestProfileName(p)
              const ini = initials(name)

              return (
                <div key={r.id} className="px-6 py-4 hover:bg-slate-50/60 transition">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-11 w-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm text-slate-800 font-black">
                        {ini}
                      </div>

                      <div className="min-w-0">
                        <div className="text-[13px] font-black text-slate-900 truncate">{name}</div>
                        <div className="text-[11px] font-bold text-slate-400 mt-1 truncate">
                          {new Date(r.date).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[12px] font-black text-slate-900">Score: {r.total_score}</div>
                        <div className="flex items-center justify-end gap-2 mt-1">
                          <span className={['h-2 w-2 rounded-full', riskDot(String(r.risk_level))].join(' ')} />
                          <span className="text-[11px] font-bold text-slate-400">Risco</span>
                        </div>
                      </div>

                      <div className={riskPill(String(r.risk_level))}>{r.risk_level}</div>

                      <button
                        onClick={() => setSelected(r)}
                        className="px-4 py-2 rounded-xl bg-white border border-slate-100 text-[11px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-2 shadow-sm"
                      >
                        VER <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL DETALHE */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-end md:items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="p-6 flex items-start justify-between gap-4 border-b border-slate-100">
              <div className="min-w-0">
                <div className="text-[16px] font-black text-slate-900">Detalhe da Avaliação</div>

                <div className="mt-2 flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                    <User size={16} className="text-slate-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-black text-slate-900 truncate">
                      {pickBestProfileName(profileMap.get(selected.user_id))}
                    </div>
                    <div className="text-[11px] font-bold text-slate-400 mt-0.5 truncate">
                      {new Date(selected.date).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-black text-slate-900">Total Score: {selected.total_score}</div>
                <div className={riskPill(String(selected.risk_level))}>{selected.risk_level}</div>
              </div>

              <div className="text-[10px] font-bold text-slate-400 mt-2">
                Interpretação rápida: {selected.risk_level === 'alto'
                  ? 'prioridade (ação recomendada)'
                  : selected.risk_level === 'atencao'
                  ? 'acompanhar e investigar sinais'
                  : 'sem sinais relevantes no ciclo'}
              </div>

              <div className="mt-5 space-y-3 max-h-[55vh] overflow-auto pr-1">
                {detailItems.map((it, idx) => (
                  <div key={`${it.q_key}-${idx}`} className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{it.q_key}</div>
                    <div className="text-[12px] font-black text-slate-900 mt-1">{it.label}</div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500">
                        Resposta literal: <span className="text-slate-900 font-black">{it.literal}</span>
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">•</span>
                      <span className="text-[11px] font-bold text-slate-500">
                        Valor: <span className="text-slate-900 font-black">{it.value ?? '—'}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-[10px] font-bold text-slate-400 mt-4">
                Ordem segue <code>survey_question_map</code> (q1..q10).
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
