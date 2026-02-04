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
}

const WEEK_PT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] // 0=Domingo

function toDateSafe(iso: string) {
  // iso esperado: YYYY-MM-DD
  const d = new Date(`${iso}T00:00:00`)
  return isNaN(d.getTime()) ? null : d
}

function formatShortDay(iso: string) {
  return iso?.slice(5) // MM-DD
}

export default function ChartsSection({ dailyMood }: Props) {
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

  const totalEntries = useMemo(() => {
    return chartData.reduce((a, b) => a + (b.entries ?? 0), 0)
  }, [chartData])

  // ✅ Se tiver 7 pontos, mostra D S T Q Q S S (igual print)
  const useWeekTicks = useMemo(() => chartData.length === 7, [chartData.length])

  const xTickFormatter = (iso: string, idx: number) => {
    if (useWeekTicks) return chartData[idx]?.dow ?? ''
    return formatShortDay(iso)
  }

  const yTickFormatter = (v: number) => {
    // 0..5 (Triste/Ok/Feliz como no print)
    // Ajuste fino pra ficar parecido visualmente
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
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black text-slate-800">Humor Médio</h3>
          <p className="text-xs text-slate-500 font-medium">
            Média diária baseada em registros reais ({totalEntries} entradas)
          </p>
        </div>

        
      </div>

      {/* ✅ altura fixa evita warning do recharts */}
      <div className="h-[260px] w-full">
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
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />

            {/* ✅ Y como no print: Triste / Ok / Feliz */}
            <YAxis
              domain={[0, 5]}
              ticks={[1, 3, 5]}
              tickFormatter={yTickFormatter}
              tick={{ fontSize: 11 }}
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
        <p className="text-xs text-slate-400 font-bold mt-3">
          Ainda sem dados suficientes para exibir o gráfico.
        </p>
      )}
    </div>
  )
}
