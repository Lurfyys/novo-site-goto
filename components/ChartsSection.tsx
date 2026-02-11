// src/components/ChartsSection.tsx
import React, { useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'

type Props = {
  dailyMood: { day: string; avg_score: number; entries: number }[]
  onSimulate?: () => void
}

const WEEK_PT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] // 0=Domingo

function toDateSafe(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  return isNaN(d.getTime()) ? null : d
}

function formatShortDay(iso: string) {
  return iso?.slice(5) // MM-DD
}

export default function ChartsSection({ dailyMood, onSimulate }: Props) {
  const chartData = useMemo(() => {
    return (dailyMood ?? [])
      .slice()
      .sort((a, b) => String(a.day).localeCompare(String(b.day)))
      .map(r => ({
        day: r.day,
        value: Number(Number(r.avg_score ?? 0).toFixed(2)),
        entries: Number(r.entries ?? 0),
        dow: (() => {
          const d = toDateSafe(String(r.day))
          return d ? WEEK_PT[d.getDay()] : ''
        })()
      }))
  }, [dailyMood])

  const totalEntries = useMemo(() => chartData.reduce((a, b) => a + (b.entries ?? 0), 0), [chartData])

  const useWeekTicks = useMemo(() => chartData.length === 7, [chartData.length])

  const xTickFormatter = (iso: string, idx: number) => {
    if (useWeekTicks) return chartData[idx]?.dow ?? ''
    return formatShortDay(iso)
  }

  const yTickFormatter = (v: number) => {
    if (v <= 1) return 'Triste'
    if (v <= 3) return 'Ok'
    if (v <= 5) return 'Feliz'
    return ''
  }

  const MoodTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const p = payload[0]?.payload
    return (
      <div className="bg-white border border-slate-100 shadow-sm rounded-xl px-3 py-2">
        <div className="text-xs font-black text-slate-800">
          {useWeekTicks ? `Dia ${p?.dow ?? ''}` : `Dia ${label}`}
        </div>
        <div className="text-[11px] font-bold text-slate-500">
          Humor: {Number(p?.value ?? 0).toFixed(2)}
        </div>
        <div className="text-[11px] font-bold text-slate-400">
          Entradas: {Number(p?.entries ?? 0)}
        </div>
      </div>
    )
  }

  return (
    // ✅ vira flex-col pra respeitar altura do pai
    <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm h-full flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[13px] font-bold text-slate-700">Humor Médio</div>
          <div className="text-[11px] font-bold text-slate-400 mt-1">
            Média diária baseada em registros reais ({totalEntries} entradas)
          </div>
        </div>

        <button
          onClick={onSimulate}
          className="text-[11px] font-black text-blue-600 hover:text-blue-700"
        >
          ✨ SIMULAR DADOS
        </button>
      </div>

      {/* ✅ ocupa o espaço restante do card */}
      <div className="mt-3 flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 14, left: 6, bottom: 0 }}>
            <defs>
              <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="70%" stopColor="#3b82f6" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.18} />

            <XAxis
              dataKey="day"
              tickFormatter={xTickFormatter as any}
              tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              domain={[0, 5]}
              ticks={[1, 3, 5]}
              tickFormatter={yTickFormatter}
              tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              width={46}
            />

            <Tooltip content={<MoodTooltip />} />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={3}
              fill="url(#moodFill)"
              dot={false}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {chartData.length === 0 && (
        <div className="text-xs text-slate-400 font-bold mt-2">
          Ainda sem dados suficientes para exibir o gráfico.
        </div>
      )}
    </div>
  )
}
