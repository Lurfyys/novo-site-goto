// src/components/EmployeeProfilePanel.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { fetchEmployeeMoodEntries, type MoodEntryRow } from '../services/employeesService'

export default function EmployeeProfilePanel({
  employeeId,
  employeeName,
  onClose
}: {
  employeeId: string
  employeeName: string
  onClose: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<MoodEntryRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        setError(null)
        setLoading(true)

        if (!employeeId) {
          setEntries([])
          setError('ID do funcionário não encontrado.')
          return
        }

        // ✅ GLOBAL: não filtra por company_id
        const data = await fetchEmployeeMoodEntries(employeeId, 50)
        if (!mounted) return
        setEntries(data)
      } catch (e: any) {
        console.error('EmployeeProfilePanel error:', e)
        if (!mounted) return
        setError(e?.message ?? 'Erro ao carregar dados.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [employeeId])

  const summary = useMemo(() => {
    if (!entries.length) return { avg: 0, last: null as null | string }
    const avg = entries.reduce((a, b) => a + (b.score ?? 0), 0) / entries.length
    return { avg: Number(avg.toFixed(2)), last: entries[0].created_at }
  }, [entries])

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="absolute right-6 top-6 bottom-6 w-full max-w-xl bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 overflow-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-slate-800">{employeeName || 'Funcionário'}</h3>
            <p className="text-xs text-slate-400 font-bold">
              ID: {employeeId ? `${employeeId.slice(0, 8)}…` : '—'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50"
            aria-label="Fechar painel do funcionário"
          >
            Fechar
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl border border-red-100 bg-red-50 text-red-700 text-sm font-bold mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">MÉDIA (ÚLTIMOS 50)</p>
            <p className="text-2xl font-black text-slate-800">{summary.avg}</p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">ÚLTIMO REGISTRO</p>
            <p className="text-sm font-black text-slate-800">
              {summary.last ? new Date(summary.last).toLocaleString() : '—'}
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Carregando…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-slate-500">Esse funcionário ainda não tem registros.</p>
        ) : (
          <div className="space-y-2">
            {entries.map(e => (
              <div key={e.id} className="p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-slate-800">Humor: {e.score ?? 0}</p>
                  <p className="text-[11px] text-slate-400 font-bold">{new Date(e.created_at).toLocaleString()}</p>
                </div>

                <p className="text-xs text-slate-500 mt-2">
                  Sono: {e.sleep_quality ?? 0} • Demanda: {e.work_demand ?? 0} • Fadiga: {e.fatigue_level ?? 0}
                </p>

                {e.note && <p className="text-sm text-slate-600 mt-2">{e.note}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
