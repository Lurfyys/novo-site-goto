// src/views/DashboardView.tsx
import React, { useEffect, useMemo, useState } from 'react'
import StatsCards from '../components/StatsCards'
import ChartsSection from '../components/ChartsSection'
import EmployeeTable from '../components/EmployeeTable'

import {
  fetchMyProfile,
  fetchGlobalEmployees,
  fetchGlobalDailyMood,
  fetchCriticalAlerts,
  fetchBurnout7d,
  type GlobalEmployeeRow,
  type DailyMoodAggRow,
  type CriticalAlertRow
} from '../services/dashboardService'

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { AlertTriangle, ChevronRight } from 'lucide-react'

type EmployeeUI = {
  id: string
  name: string
  entries: number
}

function burnoutMeta(avgScore: number) {
  if (!Number.isFinite(avgScore) || avgScore <= 0) return { label: 'Sem dados', tag: 'SEM DADOS' }
  if (avgScore <= 2) return { label: 'Alto risco', tag: 'ALERTA' } // 1–2
  if (avgScore <= 3) return { label: 'Médio risco', tag: 'ATENÇÃO' } // 3
  return { label: 'Sem risco', tag: 'OK' } // 4–5
}

export default function DashboardView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [trackingCount, setTrackingCount] = useState(0)
  const [employeesDb, setEmployeesDb] = useState<GlobalEmployeeRow[]>([])
  const [dailyMoodDb, setDailyMoodDb] = useState<DailyMoodAggRow[]>([])

  const [burnoutAvg7d, setBurnoutAvg7d] = useState(0)
  const [burnoutEntries7d, setBurnoutEntries7d] = useState(0)
  const [burnoutCriticalOnes7d, setBurnoutCriticalOnes7d] = useState(0)

  // ✅ contagens para o donut (valores reais)
  const [burnoutC12, setBurnoutC12] = useState(0)
  const [burnoutC3, setBurnoutC3] = useState(0)
  const [burnoutC45, setBurnoutC45] = useState(0)

  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlertRow[]>([])

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        setError(null)
        setLoading(true)

        await fetchMyProfile().catch(() => null)
        if (!mounted) return

        const [employees, daily, burnout7d, crit] = await Promise.all([
          fetchGlobalEmployees(),
          fetchGlobalDailyMood(30),
          fetchBurnout7d(),
          fetchCriticalAlerts({ days: 7, limit: 10 })
        ])

        if (!mounted) return

        const employeesArr = Array.isArray(employees) ? employees : []
        setEmployeesDb(employeesArr)

        const active = employeesArr.filter(e => Number(e.entries ?? 0) > 0).length
        setTrackingCount(active)

        setDailyMoodDb(Array.isArray(daily) ? daily : [])

        setBurnoutAvg7d(Number(burnout7d?.avgScore7d ?? 0))
        setBurnoutEntries7d(Number(burnout7d?.entries7d ?? 0))
        setBurnoutCriticalOnes7d(Number(burnout7d?.criticalOnes7d ?? 0))

        setBurnoutC12(Number(burnout7d?.count_1_2 ?? 0))
        setBurnoutC3(Number(burnout7d?.count_3 ?? 0))
        setBurnoutC45(Number(burnout7d?.count_4_5 ?? 0))

        setCriticalAlerts(Array.isArray(crit) ? crit : [])
      } catch (e: any) {
        console.error('DashboardView load error:', e)
        if (!mounted) return
        setError(e?.message ?? 'Erro ao carregar o dashboard.')

        setEmployeesDb([])
        setDailyMoodDb([])
        setTrackingCount(0)

        setBurnoutAvg7d(0)
        setBurnoutEntries7d(0)
        setBurnoutCriticalOnes7d(0)
        setBurnoutC12(0)
        setBurnoutC3(0)
        setBurnoutC45(0)

        setCriticalAlerts([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const employeesUI: EmployeeUI[] = useMemo(() => {
    return (employeesDb ?? []).map(e => ({
      id: e.user_id,
      name: e.name ?? 'Sem nome',
      entries: Number(e.entries ?? 0)
    }))
  }, [employeesDb])

  const employeeNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const e of employeesDb ?? []) map.set(e.user_id, e.name ?? 'Sem nome')
    return map
  }, [employeesDb])

  const dailyMoodUI = useMemo(() => {
    return (dailyMoodDb ?? []).map(d => ({
      day: d.day,
      avg_score: Number(d.avg_score ?? 0),
      entries: Number(d.entries ?? 0)
    }))
  }, [dailyMoodDb])

  const risk = useMemo(() => {
    const totalEntries = dailyMoodUI.reduce((acc, d) => acc + (d.entries ?? 0), 0)
    if (totalEntries <= 0) return { label: 'Sem dados', hint: 'Sem registros', tag: '—' }

    const weightedSum = dailyMoodUI.reduce(
      (acc, d) => acc + Number(d.avg_score ?? 0) * Number(d.entries ?? 0),
      0
    )
    const avg = weightedSum / totalEntries

    if (avg >= 4.0) return { label: 'Alto', hint: `Média ≥ 4.0 (atual: ${avg.toFixed(2)})`, tag: 'RISCO' }
    if (avg >= 2.5)
      return { label: 'Moderado', hint: `Média entre 2.5 e 4.0 (atual: ${avg.toFixed(2)})`, tag: 'ATENÇÃO' }
    return { label: 'Baixo', hint: `Média < 2.5 (atual: ${avg.toFixed(2)})`, tag: 'OK' }
  }, [dailyMoodUI])

  const burnout = useMemo(() => burnoutMeta(burnoutAvg7d), [burnoutAvg7d])

  // ✅ donut com valores reais (contagens)
  const donutData = useMemo(() => {
    return [
      { key: 'c45', name: '4-5 (Sem risco)', value: burnoutC45 },
      { key: 'c3', name: '3 (Médio)', value: burnoutC3 },
      { key: 'c12', name: '1-2 (Alto)', value: burnoutC12 }
    ].filter(x => x.value > 0)
  }, [burnoutC12, burnoutC3, burnoutC45])

  const donutHasData = useMemo(() => (burnoutEntries7d ?? 0) > 0, [burnoutEntries7d])

  const criticalCount = useMemo(() => criticalAlerts.length, [criticalAlerts])

  const alertsRecentesResolved = useMemo(() => {
    return (criticalAlerts ?? []).map(a => ({
      ...a,
      name: a.name ?? employeeNameMap.get(a.user_id) ?? 'Sem nome'
    }))
  }, [criticalAlerts, employeeNameMap])

  function onSelectEmployee(emp: EmployeeUI) {
    console.log('Selecionou funcionário:', emp)
  }

  // ✅ Tooltip que mostra CONTAGEM e não porcentagem
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

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-2xl border border-red-100 bg-red-50 text-red-700 text-sm font-bold">
          {error}
        </div>
      )}

      <StatsCards
        trackingCount={trackingCount}
        riskLabel={risk.label}
        riskHint={risk.hint}
        riskTag={risk.tag}
        criticalCount={criticalCount}
        onTrackingClick={() => {}}
        onRiskClick={() => {}}
        onAlertsClick={() => {}}
      />

      {/* ✅ LINHA PRINCIPAL: gráfico MAIS LARGO + burnout + ações */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Gráfico ocupa 2 colunas (fica bem mais largo) */}
        <div className="lg:col-span-2">
          <ChartsSection dailyMood={dailyMoodUI} />
        </div>

        {/* Burnout */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-bold text-slate-700">Índice Burnout</div>
              <div className="text-[11px] font-bold text-slate-400 mt-1">
                Últimos 7 dias • {burnoutEntries7d} entradas •{' '}
                {burnoutCriticalOnes7d > 0 ? `⚠ ${burnoutCriticalOnes7d} com score=1` : 'Sem score=1'}
              </div>
            </div>

            <div
              className={[
                'text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border',
                burnout.tag === 'ALERTA'
                  ? 'bg-rose-50 text-rose-700 border-rose-100'
                  : burnout.tag === 'ATENÇÃO'
                  ? 'bg-yellow-50 text-yellow-800 border-yellow-100'
                  : burnout.tag === 'OK'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-slate-50 text-slate-500 border-slate-100'
              ].join(' ')}
            >
              {burnout.tag}
            </div>
          </div>

          <div className="mt-4 h-[220px] w-full relative">
            {!donutHasData ? (
              <div className="h-full flex items-center justify-center text-slate-300 text-sm font-bold">
                Sem dados para calcular
              </div>
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

                  <Tooltip content={<BurnoutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="text-[11px] font-bold text-slate-400 mt-2">
            Regras: 1–2 = vermelho • 3 = laranja • 4–5 = azul
          </div>
        </div>

        {/* Ações */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-bold text-slate-700">Ações Prioritárias</div>
            <div className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
              SISTEMA GNR1
            </div>
          </div>

          <div className="text-slate-300 text-sm font-bold text-center py-12">(vazio por enquanto)</div>

          <button className="w-full bg-slate-900 text-white font-black text-xs rounded-xl py-3">
            EXECUTAR WORKFLOW GNR1
          </button>
        </div>
      </div>

      {/* ✅ LINHA DE BAIXO: Funcionários (grande) + Alertas Recentes (direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <EmployeeTable employees={employeesUI} onSelectEmployee={onSelectEmployee} />
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[13px] font-bold text-slate-700">Alertas Recentes</div>
            <div className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-100">
              {criticalCount} CRÍTICOS
            </div>
          </div>

          <div className="space-y-3">
            {alertsRecentesResolved.length === 0 ? (
              <div className="text-slate-300 text-sm font-bold text-center py-10">
                Sem alertas críticos (score=1)
              </div>
            ) : (
              alertsRecentesResolved.slice(0, 6).map((a, idx) => (
                <div
                  key={`${a.user_id}-${a.created_at ?? idx}`}
                  className="p-4 rounded-2xl border border-rose-100 bg-rose-50 flex items-center justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white border border-rose-100 text-rose-600">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <div className="text-[12px] font-black text-slate-800">{a.name}</div>
                      <div className="text-[11px] font-bold text-slate-500">
                        Score: {a.score} • {a.day ?? '—'}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 mt-1">
                        user_id: {a.user_id}
                      </div>
                    </div>
                  </div>

                  <button className="px-3 py-2 rounded-xl bg-white border border-slate-100 text-xs font-black text-slate-700 flex items-center gap-2">
                    VER DETALHES <ChevronRight size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {loading && <p className="text-xs text-slate-400 font-bold">Carregando dados…</p>}
    </div>
  )
}
