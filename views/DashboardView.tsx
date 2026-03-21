import React, { useEffect, useMemo, useState } from 'react'

import {
  fetchMyProfile,
  fetchScopedEmployees,
  fetchScopedDailyMood,
  fetchCriticalAlerts,
  fetchBurnout7d,
  fetchEmployeeStatusByMonth,
  type GlobalEmployeeRow,
  type DailyMoodAggRow,
  type CriticalAlertRow,
  type EmployeeMonthStatusRow
} from '../services/dashboardService'

import { fetchAiActions, type AiActionItem } from '../services/aiActionsService'
import EmployeeProfilePanel from '../components/EmployeeProfilePanel'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts'

import { AlertTriangle, ChevronRight, Calendar, Sparkles, X } from 'lucide-react'

type EmployeeUI = {
  user_id: string
  name: string
  entries: number
  statusLabel: string
  statusTone: 'ok' | 'warn' | 'danger' | 'muted'
}

function monthKeyFromISO(date?: string | null) {
  if (!date) return ''
  return String(date).slice(0, 7)
}

function formatMonthLabel(ym: string) {
  if (!ym || ym.length < 7) return ym
  const [y, m] = ym.split('-')
  const monthIndex = Number(m) - 1
  const date = new Date(Number(y), Math.max(0, monthIndex), 1)
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function burnoutMeta(avgScore: number) {
  if (!Number.isFinite(avgScore) || avgScore <= 0) return { label: 'Sem dados', tag: 'SEM DADOS' }
  if (avgScore <= 2) return { label: 'Alto risco', tag: 'ATENÇÃO' }
  if (avgScore <= 3) return { label: 'Médio risco', tag: 'ATENÇÃO' }
  return { label: 'Sem risco', tag: 'OK' }
}

function isAiUnavailableError(e: any) {
  const msg = String(e?.message ?? '').toLowerCase()
  const details = String(e?.details ?? '').toLowerCase()
  return (
    msg.includes('insufficient_quota') ||
    msg.includes('exceeded your current quota') ||
    msg.includes('quota') ||
    details.includes('insufficient_quota') ||
    details.includes('exceeded your current quota') ||
    details.includes('quota')
  )
}

function tonePill(tone: 'ok' | 'warn' | 'danger' | 'muted') {
  if (tone === 'danger') return 'bg-rose-50 text-rose-700 border-rose-100'
  if (tone === 'warn') return 'bg-yellow-50 text-yellow-800 border-yellow-100'
  if (tone === 'ok') return 'bg-emerald-50 text-emerald-700 border-emerald-100'
  return 'bg-slate-50 text-slate-500 border-slate-100'
}

function dotTone(tone: 'ok' | 'warn' | 'danger' | 'muted') {
  if (tone === 'danger') return 'bg-rose-500'
  if (tone === 'warn') return 'bg-yellow-500'
  if (tone === 'ok') return 'bg-emerald-500'
  return 'bg-slate-300'
}

function weekdayInitialFromISO(iso?: string) {
  if (!iso) return ''
  const d = new Date(`${iso}T12:00:00`)
  const day = d.getDay()
  const map = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
  return map[day] ?? ''
}

const CardShell = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={['bg-white border border-slate-100 shadow-sm rounded-[2rem] min-w-0', className].join(' ')}>
    {children}
  </div>
)

const MiniTag = ({ text, tone }: { text: string; tone: 'ok' | 'warn' | 'danger' | 'muted' }) => (
  <div
    className={[
      'text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border',
      tonePill(tone)
    ].join(' ')}
  >
    {text}
  </div>
)

const MetricCard = ({
  icon,
  title,
  value,
  subtitle,
  tagText,
  tagTone,
  actionText,
  onActionClick
}: {
  icon: React.ReactNode
  title: string
  value: string
  subtitle?: string
  tagText?: string
  tagTone?: 'ok' | 'warn' | 'danger' | 'muted'
  actionText?: string
  onActionClick?: () => void
}) => (
  <CardShell className="p-6">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">{icon}</div>
        <div>
          <div className="text-[13px] font-bold text-slate-700">{title}</div>
          <div className="text-[26px] font-black text-slate-900 mt-1 leading-none">{value}</div>
          {subtitle && <div className="text-[11px] font-bold text-slate-400 mt-2">{subtitle}</div>}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        {tagText && tagTone && <MiniTag text={tagText} tone={tagTone} />}
        {actionText && (
          <button
            onClick={onActionClick}
            className="text-[11px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            {actionText} <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  </CardShell>
)

const BurnoutTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  if (!p) return null
  return (
    <div className="bg-white border border-slate-100 shadow-sm rounded-xl px-3 py-2">
      <div className="text-xs font-black text-slate-800">{p.name}</div>
      <div className="text-[11px] font-bold text-slate-500">Qtd: {p.value}</div>
    </div>
  )
}

function AiWorkflowModal({
  open,
  onClose,
  title,
  subtitle,
  items
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  items: { title: string; desc?: string }[]
}) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-[720px] bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="relative bg-slate-900 text-white px-8 py-6">
            <div className="text-[10px] font-black tracking-widest uppercase text-slate-200">
              IA ENGINE GNR1
            </div>
            <div className="mt-2 text-[26px] font-black leading-none">{title}</div>
            {subtitle && <div className="mt-2 text-[12px] font-bold text-slate-300">{subtitle}</div>}

            <button
              onClick={onClose}
              className="absolute top-5 right-5 h-10 w-10 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            <div className="absolute right-10 top-10 text-white/10 pointer-events-none select-none">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
                <path
                  d="M13 2L3 14h7l-1 8 12-16h-7l-1-4z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div className="px-8 py-6">
            {items.length === 0 ? (
              <div className="py-10 text-center text-slate-400 font-bold">Nenhuma ação disponível.</div>
            ) : (
              <div className="space-y-5">
                {items.slice(0, 6).map((it, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="shrink-0">
                      <div className="h-10 w-10 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center justify-center text-[12px] font-black text-blue-600">
                        {idx + 1}
                      </div>
                      <div className="mx-auto mt-2 h-10 w-px bg-slate-100" />
                    </div>

                    <div className="pt-1">
                      <div className="text-[14px] font-black text-slate-900">{it.title}</div>
                      {it.desc && <div className="mt-1 text-[12px] font-bold text-slate-500">{it.desc}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-8 py-6 border-t border-slate-100 bg-white flex items-center justify-center">
            <button
              onClick={onClose}
              className="h-12 px-8 rounded-2xl border border-slate-200 bg-white text-slate-700 font-black text-[12px] hover:bg-slate-50"
            >
              FECHAR PAINEL
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardView({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedMonth, setSelectedMonth] = useState<string>('')

  const [trackingCount, setTrackingCount] = useState(0)
  const [employeesDb, setEmployeesDb] = useState<GlobalEmployeeRow[]>([])
  const [dailyMoodDb, setDailyMoodDb] = useState<DailyMoodAggRow[]>([])
  const [employeeStatusMonthDb, setEmployeeStatusMonthDb] = useState<EmployeeMonthStatusRow[]>([])

  const [burnoutCriticalOnes7d, setBurnoutCriticalOnes7d] = useState(0)

  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlertRow[]>([])

  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null)

  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('idle')
  const aiLoading = aiStatus === 'loading'
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiActions, setAiActions] = useState<AiActionItem[]>([])
  const [aiModalOpen, setAiModalOpen] = useState(false)

  const MOOD_BLUE = '#2563EB'

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        setError(null)
        setLoading(true)

        await fetchMyProfile().catch(() => null)
        if (!mounted) return

        const [employees, daily, burnout7d, crit] = await Promise.all([
          fetchScopedEmployees(),
          fetchScopedDailyMood(180),
          fetchBurnout7d(),
          fetchCriticalAlerts({ days: 180, limit: 100 })
        ])

        if (!mounted) return

        const employeesArr = Array.isArray(employees) ? employees : []
        setEmployeesDb(employeesArr)

        const active = employeesArr.filter(e => Number(e.entries ?? 0) > 0).length
        setTrackingCount(active)

        const dailyArr = Array.isArray(daily) ? daily : []
        setDailyMoodDb(dailyArr)

        const critArr = Array.isArray(crit) ? crit : []
        setCriticalAlerts(critArr)

        setBurnoutCriticalOnes7d(Number(burnout7d?.criticalOnes7d ?? 0))

        const monthSet = new Set<string>()
        for (const d of dailyArr) {
          const k = monthKeyFromISO(d.day)
          if (k) monthSet.add(k)
        }
        for (const a of critArr) {
          const k = monthKeyFromISO(a.day ?? a.created_at)
          if (k) monthSet.add(k)
        }
        for (const e of employeesArr) {
          const k = monthKeyFromISO(e.last_entry_at)
          if (k) monthSet.add(k)
        }

        const months = Array.from(monthSet).sort((a, b) => b.localeCompare(a))
        const fallback = new Date().toISOString().slice(0, 7)

        setSelectedMonth(prev => {
          if (prev && months.includes(prev)) return prev
          return months[0] ?? prev ?? fallback
        })
      } catch (e: any) {
        console.error('DashboardView load error:', e)
        if (!mounted) return

        setError(e?.message ?? 'Erro ao carregar o dashboard.')

        setEmployeesDb([])
        setDailyMoodDb([])
        setTrackingCount(0)
        setEmployeeStatusMonthDb([])
        setBurnoutCriticalOnes7d(0)
        setCriticalAlerts([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  const monthOptions = useMemo(() => {
    const set = new Set<string>()
    for (const d of dailyMoodDb ?? []) {
      const k = monthKeyFromISO(d.day)
      if (k) set.add(k)
    }
    for (const a of criticalAlerts ?? []) {
      const k = monthKeyFromISO(a.day ?? a.created_at)
      if (k) set.add(k)
    }
    for (const e of employeesDb ?? []) {
      const k = monthKeyFromISO(e.last_entry_at)
      if (k) set.add(k)
    }

    const arr = Array.from(set).sort((a, b) => b.localeCompare(a))
    if (arr.length === 0) arr.push(new Date().toISOString().slice(0, 7))
    return arr
  }, [dailyMoodDb, criticalAlerts, employeesDb])

  useEffect(() => {
    let mounted = true

    async function loadMonthEmployees() {
      try {
        const month = selectedMonth || monthOptions[0] || ''
        if (!month) {
          if (mounted) setEmployeeStatusMonthDb([])
          return
        }

        const rows = await fetchEmployeeStatusByMonth(month)
        if (!mounted) return

        setEmployeeStatusMonthDb(Array.isArray(rows) ? rows : [])
      } catch (e) {
        console.error('loadMonthEmployees error:', e)
        if (mounted) setEmployeeStatusMonthDb([])
      }
    }

    loadMonthEmployees()
    return () => { mounted = false }
  }, [selectedMonth, monthOptions])

  const cycleLabel = useMemo(() => formatMonthLabel(selectedMonth || monthOptions[0] || ''), [selectedMonth, monthOptions])

  const employeeNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const e of employeesDb ?? []) map.set(e.user_id, e.name ?? 'Sem nome')
    return map
  }, [employeesDb])

  const dailyMoodByMonth = useMemo(() => {
    const m = selectedMonth || monthOptions[0] || ''
    return (dailyMoodDb ?? []).filter(d => monthKeyFromISO(d.day) === m)
  }, [dailyMoodDb, selectedMonth, monthOptions])

  const criticalAlertsByMonth = useMemo(() => {
    const m = selectedMonth || monthOptions[0] || ''
    return (criticalAlerts ?? []).filter(a => monthKeyFromISO(a.day ?? a.created_at) === m)
  }, [criticalAlerts, selectedMonth, monthOptions])

  const moodChartData = useMemo(() => {
    const src = (dailyMoodByMonth ?? [])
      .map(d => ({
        rawDay: d.day,
        label: weekdayInitialFromISO(d.day),
        score: Number(d.avg_score ?? 0),
        entries: Number(d.entries ?? 0)
      }))
      .filter(x => x.rawDay)

    src.sort((a, b) => String(a.rawDay).localeCompare(String(b.rawDay)))
    return src.slice(-7)
  }, [dailyMoodByMonth])

  const risk = useMemo(() => {
    const totalEntries = (dailyMoodByMonth ?? []).reduce((acc, d) => acc + Number(d.entries ?? 0), 0)
    if (totalEntries <= 0) return { label: 'Sem dados', hint: 'Sem registros', tone: 'muted' as const }

    const weightedSum = (dailyMoodByMonth ?? []).reduce(
      (acc, d) => acc + Number(d.avg_score ?? 0) * Number(d.entries ?? 0),
      0
    )
    const avg = weightedSum / totalEntries

    if (avg <= 2.0) return { label: 'Alto', hint: `Média ≤ 2.0 (atual: ${avg.toFixed(2)})`, tone: 'danger' as const }
    if (avg <= 3.0) return { label: 'Moderado', hint: `Média entre 2.0 e 3.0 (atual: ${avg.toFixed(2)})`, tone: 'warn' as const }
    return { label: 'Baixo', hint: `Média > 3.0 (atual: ${avg.toFixed(2)})`, tone: 'ok' as const }
  }, [dailyMoodByMonth])

  const burnoutByMonth = useMemo(() => {
    const rows = dailyMoodByMonth ?? []

    let totalEntries = 0
    let weightedSum = 0
    let c12 = 0
    let c3 = 0
    let c45 = 0
    let criticalOnes = 0

    for (const d of rows) {
      const entries = Number(d.entries ?? 0)
      const score = Number(d.avg_score ?? 0)

      totalEntries += entries
      weightedSum += score * entries

      if (score >= 1 && score < 2.5) {
        c12 += entries
        if (score <= 1.5) criticalOnes += entries
      } else if (score >= 2.5 && score < 3.5) {
        c3 += entries
      } else if (score >= 3.5) {
        c45 += entries
      }
    }

    const avgScore = totalEntries > 0 ? weightedSum / totalEntries : 0
    return { avgScore, totalEntries, criticalOnes, c12, c3, c45 }
  }, [dailyMoodByMonth])

  const burnout = useMemo(() => burnoutMeta(burnoutByMonth.avgScore), [burnoutByMonth.avgScore])

  const donutData = useMemo(() => {
    return [
      { key: 'c45', name: '4-5 (Sem risco)', value: burnoutByMonth.c45 },
      { key: 'c3', name: '3 (Médio)', value: burnoutByMonth.c3 },
      { key: 'c12', name: '1-2 (Alto)', value: burnoutByMonth.c12 }
    ].filter(x => x.value > 0)
  }, [burnoutByMonth])

  const donutHasData = useMemo(() => burnoutByMonth.totalEntries > 0, [burnoutByMonth.totalEntries])

  const criticalCount = useMemo(() => criticalAlertsByMonth.length, [criticalAlertsByMonth])

  const alertsRecentesResolved = useMemo(() => {
    return (criticalAlertsByMonth ?? []).map(a => ({
      ...a,
      name: a.name ?? employeeNameMap.get(a.user_id) ?? 'Sem nome'
    }))
  }, [criticalAlertsByMonth, employeeNameMap])

  const employeesStatusUI: EmployeeUI[] = useMemo(() => {
    const criticalSet = new Set((criticalAlertsByMonth ?? []).map(a => a.user_id))

    const base = (employeeStatusMonthDb ?? []).map(e => {
      const entries = Number(e.entries ?? 0)
      const name = e.name ?? employeeNameMap.get(e.user_id) ?? 'Sem nome'
      const isCrit = criticalSet.has(e.user_id)

      if (isCrit) return { user_id: e.user_id, name, entries, statusLabel: 'Crítico', statusTone: 'danger' as const }
      if (entries > 0) return { user_id: e.user_id, name, entries, statusLabel: 'Estável', statusTone: 'ok' as const }
      return { user_id: e.user_id, name, entries, statusLabel: 'Sem dados', statusTone: 'muted' as const }
    })

    base.sort((a, b) => {
      const t = (x: EmployeeUI) => (x.statusTone === 'danger' ? 2 : x.entries > 0 ? 1 : 0)
      return t(b) - t(a)
    })

    return base.slice(0, 8)
  }, [employeeStatusMonthDb, criticalAlertsByMonth, employeeNameMap])

  // ✅ MELHORADO: prompt agora inclui o mês selecionado e o nível de risco atual
  async function handleGenerateAi() {
    if (aiStatus === 'unavailable' || aiStatus === 'loading') return

    try {
      setAiError(null)
      setAiStatus('loading')

      const mesAtual = formatMonthLabel(selectedMonth || monthOptions[0] || '')
      const nivelRisco = risk.label
      const mediaHumor = burnoutByMonth.avgScore > 0 ? burnoutByMonth.avgScore.toFixed(2) : 'sem dados'
      const alertasCriticos = criticalCount
      const funcionariosAtivos = trackingCount

      const prompt = `
Ciclo analisado: ${mesAtual}
Nível de risco psicossocial: ${nivelRisco}
Média de humor dos funcionários: ${mediaHumor}/5
Alertas críticos (score=1) no ciclo: ${alertasCriticos}
Funcionários em acompanhamento: ${funcionariosAtivos}

Gere ações prioritárias e PERSONALIZADAS para este ciclo específico.
Baseie cada ação nos relatos reais dos funcionários dos últimos 7 dias (já disponíveis no contexto da função).
Se houver alertas críticos, priorize intervenções imediatas.
      `.trim()

      const actions = await fetchAiActions(prompt)
      const arr = Array.isArray(actions) ? actions : []

      setAiActions(arr)
      setAiStatus('ready')

      if (arr.length > 0) setAiModalOpen(true)
    } catch (e: any) {
      console.error('AI actions error:', e)

      if (isAiUnavailableError(e)) {
        setAiStatus('unavailable')
        setAiActions([])
        setAiError(null)
        return
      }

      setAiStatus('idle')
      setAiActions([])
      setAiError(e?.message ?? 'Erro ao gerar ações com IA.')
    }
  }

  const urgentAction = useMemo(() => {
    const shouldUrgent = risk.tone === 'danger' || burnoutByMonth.criticalOnes > 0 || criticalCount > 0
    if (!shouldUrgent) return null
    return {
      title: 'Intervenção Urgente',
      desc:
        burnoutByMonth.criticalOnes > 0
          ? `Sinais detectados: ${burnoutByMonth.criticalOnes} registros com score=1 no ciclo selecionado.`
          : 'Sinais detectados no acompanhamento recente.'
    }
  }, [risk.tone, burnoutByMonth.criticalOnes, criticalCount])

  function openEmployeePanel(user_id: string, name: string) {
    setSelectedEmployee({ id: user_id, name })
  }

  const workflowItems = useMemo(() => {
    return (aiActions ?? []).map(a => ({
      title: String(a?.title ?? 'Ação'),
      desc: String(a?.why ?? '')
    }))
  }, [aiActions])

  return (
    <div className="space-y-6">
      <AiWorkflowModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="Workflow de Intervenção"
        subtitle="Plano estratégico gerado com base nos indicadores atuais."
        items={workflowItems}
      />

      {error && (
        <div className="p-4 rounded-2xl border border-red-100 bg-red-50 text-red-700 text-sm font-bold">{error}</div>
      )}

      {selectedEmployee && (
        <EmployeeProfilePanel
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
          onClose={() => setSelectedEmployee(null)}
        />
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[26px] font-black text-slate-900">Painel Executivo GNR1</div>
          <div className="text-[12px] font-bold text-slate-400 mt-1">
            Análise macro das condições psicossociais da organização.
          </div>
        </div>

        <div className="px-4 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
            <Calendar size={18} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ciclo Atual</div>
            <select
              value={selectedMonth || monthOptions[0] || ''}
              onChange={e => setSelectedMonth(e.target.value)}
              className="text-[12px] font-black text-slate-900 bg-transparent outline-none cursor-pointer"
            >
              {monthOptions.map(m => (
                <option key={m} value={m}>{formatMonthLabel(m)}</option>
              ))}
            </select>
            <div className="hidden">{cycleLabel}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MetricCard
          icon={<span className="text-slate-700 font-black">⚑</span>}
          title="Risco Psicossocial"
          value={risk.label}
          subtitle={risk.hint}
          tagText={risk.tone === 'danger' ? 'PRIORIDADE' : risk.tone === 'warn' ? 'ATENÇÃO' : risk.tone === 'ok' ? 'OK' : '—'}
          tagTone={risk.tone}
        />

        <MetricCard
          icon={<AlertTriangle size={18} />}
          title="Alertas Críticos"
          value={String(criticalCount)}
          subtitle={`Ciclo: ${formatMonthLabel(selectedMonth || monthOptions[0] || '')}`}
          tagText={criticalCount > 0 ? 'PRIORIDADE' : 'OK'}
          tagTone={criticalCount > 0 ? 'danger' : 'ok'}
          actionText="VER ALERTAS"
          onActionClick={() => onNavigate?.('alerts')}
        />

        <MetricCard
          icon={<span className="text-slate-700 font-black">👥</span>}
          title="Em Acompanhamento"
          value={String(trackingCount)}
          subtitle="Funcionários ativos"
          tagText={trackingCount > 0 ? 'ATIVO' : '—'}
          tagTone={trackingCount > 0 ? 'ok' : 'muted'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <CardShell className="p-6 flex flex-col lg:h-[380px]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-bold text-slate-700">Humor Médio</div>
              <div className="text-[11px] font-bold text-slate-400 mt-1">
                Ciclo: {formatMonthLabel(selectedMonth || monthOptions[0] || '')} • Últimos {moodChartData.length || 0} dias exibidos
              </div>
            </div>
          </div>

          <div className="mt-4 flex-1 min-h-0 w-full min-w-0">
            {moodChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-300 text-sm font-bold">Sem dados para exibir</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={moodChartData} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="moodFillBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={'#2563EB'} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={'#2563EB'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 800, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis
                    domain={[1, 5]}
                    ticks={[5, 3, 1]}
                    tickFormatter={(v: number) => (v === 5 ? 'Feliz' : v === 3 ? 'Ok' : 'Triste')}
                    tick={{ fontSize: 11, fontWeight: 800, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <ReTooltip
                    content={({ active, payload, label }: any) => {
                      if (!active || !payload?.length) return null
                      const p = payload[0]?.payload
                      return (
                        <div className="bg-white border border-slate-100 shadow-sm rounded-xl px-3 py-2">
                          <div className="text-xs font-black text-slate-800">{label}</div>
                          <div className="text-[11px] font-bold text-slate-500">
                            Score: {Number(p?.score ?? 0).toFixed(2)} • Entradas: {Number(p?.entries ?? 0)}
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Area type="monotone" dataKey="score" stroke={MOOD_BLUE} strokeWidth={3} fill="url(#moodFillBlue)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardShell>

        <CardShell className="p-6 flex flex-col lg:h-[380px]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-bold text-slate-700">Índice de Possível Burnout</div>
              <div className="text-[11px] font-bold text-slate-400 mt-1">
                Ciclo: {formatMonthLabel(selectedMonth || monthOptions[0] || '')} • {burnoutByMonth.totalEntries} entradas • {burnoutByMonth.criticalOnes > 0 ? `⚠ ${burnoutByMonth.criticalOnes} com score=1` : 'Sem score=1'}
              </div>
            </div>
            <MiniTag text={burnout.tag} tone={burnout.tag === 'OK' ? 'ok' : burnout.tag === 'ATENÇÃO' ? 'warn' : 'muted'} />
          </div>

          <div className="mt-4 flex-1 min-h-0 w-full min-w-0">
            {!donutHasData ? (
              <div className="h-full flex items-center justify-center text-slate-300 text-sm font-bold">Sem dados para calcular</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData.length ? donutData : [{ name: 'Sem dados', value: 1 }]}
                    dataKey="value"
                    innerRadius={58}
                    outerRadius={82}
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={2}
                    stroke="none"
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#fb923c" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <ReTooltip content={<BurnoutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="text-[11px] font-bold text-slate-400 mt-2">Regras: 1–2 = vermelho • 3 = laranja • 4–5 = azul</div>
        </CardShell>

        <CardShell className="p-6 flex flex-col lg:h-[380px]">
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-bold text-slate-700">Ações Prioritárias</div>
            <div className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
              SISTEMA GNR1
            </div>
          </div>

          {urgentAction ? (
            <div className="mt-4 p-4 rounded-2xl border border-rose-100 bg-rose-50">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white border border-rose-100 text-rose-600">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <div className="text-[12px] font-black text-slate-800">{urgentAction.title}</div>
                  <div className="text-[11px] font-bold text-slate-500 mt-1">{urgentAction.desc}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-4 rounded-2xl border border-slate-100 bg-slate-50 text-slate-400 text-sm font-bold text-center">
              Nenhuma ação urgente no momento
            </div>
          )}

          {aiError && aiStatus !== 'unavailable' && (
            <div className="mt-4 p-3 rounded-2xl border border-red-100 bg-red-50 text-red-700 text-xs font-black">
              {aiError}
            </div>
          )}

          <div className="mt-4 flex-1 min-h-0 overflow-auto pr-1">
            {aiStatus === 'unavailable' ? (
              <div className="p-4 rounded-2xl border border-yellow-200 bg-yellow-50 text-yellow-800 text-sm font-bold text-center">
                🤖 IA temporariamente indisponível
                <div className="text-xs font-medium mt-1 text-yellow-700">Ative o plano para gerar ações automaticamente</div>
              </div>
            ) : aiStatus === 'loading' ? (
              <div className="text-slate-400 text-sm font-bold text-center py-10">Gerando ações...</div>
            ) : aiActions.length === 0 ? (
              <div className="text-slate-300 text-sm font-bold text-center py-10">Nenhuma ação gerada ainda.</div>
            ) : (
              <div className="space-y-3">
                {aiActions.slice(0, 6).map((a, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAiModalOpen(true)}
                    className="w-full text-left p-4 rounded-2xl border bg-slate-50 hover:bg-slate-50/80 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-black">{a.title}</div>
                        <div className="text-xs text-slate-500 mt-1">{a.why}</div>
                      </div>
                      <span className="text-xs font-black">{a.priority}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleGenerateAi}
            disabled={aiLoading || aiStatus === 'unavailable'}
            className={[
              'mt-4 w-full font-black text-xs rounded-xl py-3 flex items-center justify-center gap-2',
              aiLoading || aiStatus === 'unavailable' ? 'bg-slate-200 text-slate-500' : 'bg-slate-900 text-white'
            ].join(' ')}
          >
            <Sparkles size={16} />
            {aiLoading ? 'GERANDO...' : 'GERAR IDEIAS'}
          </button>

          {aiActions.length > 0 && aiStatus !== 'loading' && (
            <button
              onClick={() => setAiModalOpen(true)}
              className="mt-2 w-full font-black text-xs rounded-xl py-3 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              VER WORKFLOW <ChevronRight size={16} />
            </button>
          )}
        </CardShell>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <CardShell className="p-6 lg:col-span-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[13px] font-bold text-slate-700">Status Recentes</div>
              <div className="text-[11px] font-bold text-slate-400 mt-1">
                Visão rápida da saúde dos colaboradores • Ciclo: {formatMonthLabel(selectedMonth || monthOptions[0] || '')}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
                Top 8
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="grid grid-cols-12 gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
              <div className="col-span-7">Colaborador</div>
              <div className="col-span-3">Status</div>
              <div className="col-span-2 text-right">Ação</div>
            </div>

            <div className="mt-2 divide-y divide-slate-100">
              {employeesStatusUI.length === 0 ? (
                <div className="text-slate-300 text-sm font-bold text-center py-10">Sem funcionários para exibir</div>
              ) : (
                employeesStatusUI.map((emp, idx) => (
                  <div
                    key={`${emp.user_id}-${idx}`}
                    className="py-4 px-2 grid grid-cols-12 gap-3 items-center hover:bg-slate-50/60 rounded-2xl transition"
                  >
                    <div className="col-span-7 flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-[12px] font-black text-slate-700 shadow-sm">
                        {(emp.name?.trim()?.[0] ?? 'S').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-black text-slate-900 truncate">{emp.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 mt-1 truncate">
                          Registros: {emp.entries} • ID: {emp.user_id.slice(0, 8)}…
                        </div>
                      </div>
                    </div>

                    <div className="col-span-3 flex items-center gap-2">
                      <span className={['h-2.5 w-2.5 rounded-full', dotTone(emp.statusTone)].join(' ')} />
                      <span className={['text-[11px] font-black px-3 py-2 rounded-xl border', tonePill(emp.statusTone)].join(' ')}>
                        {emp.statusLabel}
                      </span>
                    </div>

                    <div className="col-span-2 flex justify-end">
                      <button
                        onClick={() => openEmployeePanel(emp.user_id, emp.name)}
                        className="px-3 py-2 rounded-xl bg-white border border-slate-100 text-[11px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-2 shadow-sm"
                      >
                        VER <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardShell>

        <CardShell className="p-6 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-bold text-slate-700">Alertas Recentes</div>
            <MiniTag text={`${criticalCount} CRÍTICOS`} tone={criticalCount > 0 ? 'danger' : 'ok'} />
          </div>

          <div className="mt-2 text-[11px] font-bold text-slate-400">
            Ciclo: {formatMonthLabel(selectedMonth || monthOptions[0] || '')}
          </div>

          <div className="mt-4 space-y-3 max-h-[280px] overflow-auto pr-1">
            {alertsRecentesResolved.length === 0 ? (
              <div className="text-slate-300 text-sm font-bold text-center py-10">Sem alertas críticos (score=1)</div>
            ) : (
              alertsRecentesResolved.slice(0, 10).map((a, idx) => (
                <div
                  key={`${a.user_id}-${a.created_at ?? a.day ?? 'x'}-${idx}`}
                  className="p-4 rounded-2xl border border-rose-100 bg-rose-50 flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-white border border-rose-100 text-rose-600">
                      <AlertTriangle size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-black text-slate-800 truncate">{a.name}</div>
                      <div className="text-[11px] font-bold text-slate-500 truncate">
                        Score: {a.score} • {a.day ?? a.created_at ?? '—'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => openEmployeePanel(a.user_id, a.name ?? 'Sem nome')}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-100 text-xs font-black text-slate-700 flex items-center gap-2 whitespace-nowrap"
                  >
                    VER <ChevronRight size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </CardShell>
      </div>

      {loading && <p className="text-xs text-slate-400 font-bold">Carregando dados…</p>}
    </div>
  )
}