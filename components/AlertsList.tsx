import React, { useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import type { RecentCriticalAlertRow } from '../services/dashboardService'

type Props = {
  alerts?: RecentCriticalAlertRow[]
}

function formatDay(day: string) {
  // day vem yyyy-mm-dd
  if (!day) return ''
  const [y, m, d] = day.split('-')
  return `${d}/${m}/${y}`
}

const AlertsList: React.FC<Props> = ({ alerts = [] }) => {
  const list = useMemo(() => alerts ?? [], [alerts])
  const count = list.length

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[13px] font-bold text-slate-700">Alertas Recentes</div>

        <div className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
          {count} CRÍTICOS
        </div>
      </div>

      {count === 0 ? (
        <div className="h-[120px] flex items-center justify-center text-slate-300 text-sm font-bold">
          (sem alertas)
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((a, idx) => (
            <div
              key={`${a.user_id}-${a.day}-${idx}`}
              className="p-4 rounded-2xl border border-rose-100 bg-rose-50 flex items-center justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 rounded-xl bg-white border border-rose-100 text-rose-600">
                  <AlertTriangle size={18} />
                </div>

                <div>
                  <div className="text-[13px] font-black text-slate-800">{a.name ?? 'Sem nome'}</div>
                  <div className="text-[11px] font-bold text-slate-500">
                    Score: <span className="text-rose-700">{a.score}</span> • {formatDay(a.day)}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 mt-1">user_id: {a.user_id}</div>
                </div>
              </div>

              <button className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-white border border-slate-100 text-slate-700">
                Ver detalhes →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AlertsList
