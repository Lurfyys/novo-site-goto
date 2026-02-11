import React, { useEffect, useMemo, useState } from 'react'
import { fetchEmployeeMoodEntries, type MoodEntryRow } from '../services/employeesService'
import { fetchEmployeeContact } from '../services/employeeContactService'

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as ReTooltip, CartesianGrid } from 'recharts'

type Props = {
  employeeId: string
  employeeName: string
  onClose: () => void
}

function initials(name?: string) {
  const s = String(name ?? '').trim()
  if (!s) return '??'
  const parts = s.split(/\s+/).slice(0, 2)
  return parts.map(p => (p[0] ?? '').toUpperCase()).join('')
}

function fmtDayLabel(iso?: string) {
  if (!iso) return ''
  const d = new Date(`${iso}T12:00:00`)
  const map = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  return map[d.getDay()] ?? ''
}

function safeDate(iso?: string) {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

function groupMoodLastDays(entries: MoodEntryRow[], days = 7) {
  const map = new Map<string, { sum: number; n: number }>()
  for (const e of entries) {
    const created = safeDate(e.created_at)
    if (!created) continue
    const key = created.toISOString().slice(0, 10)
    const score = Number(e.score ?? 0)
    if (!Number.isFinite(score)) continue
    const prev = map.get(key) ?? { sum: 0, n: 0 }
    map.set(key, { sum: prev.sum + score, n: prev.n + 1 })
  }

  const keys = Array.from(map.keys()).sort((a, b) => a.localeCompare(b))
  const sliced = keys.slice(-days)

  return sliced.map(k => {
    const v = map.get(k)!
    const avg = v.n > 0 ? v.sum / v.n : 0
    return { day: k, label: fmtDayLabel(k), value: Number(avg.toFixed(2)), count: v.n }
  })
}

function whatsappPhone(raw?: string | null) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (!digits) return null
  return digits.startsWith('55') ? digits : `55${digits}`
}

function openWhatsApp(phone?: string | null, name?: string) {
  const p = whatsappPhone(phone)
  if (!p) return
  const msg = encodeURIComponent(`Olá ${name ?? ''}`)
  window.open(`https://wa.me/${p}?text=${msg}`, '_blank')
}

const MoodTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  if (!p) return null
  return (
    <div className="bg-white border border-slate-100 shadow-sm rounded-xl px-3 py-2">
      <div className="text-xs font-black text-slate-800">{p.label}</div>
      <div className="text-[11px] font-bold text-slate-500">
        Score médio: {Number(p.value ?? 0).toFixed(2)} • Registros: {Number(p.count ?? 0)}
      </div>
    </div>
  )
}

export default function EmployeeProfilePanel({ employeeId, employeeName, onClose }: Props) {
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<MoodEntryRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const [contactLoading, setContactLoading] = useState(true)
  const [role, setRole] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [phone, setPhone] = useState<string | null>(null)
  const [cpf, setCpf] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadContact() {
      try {
        setContactLoading(true)
        const c = await fetchEmployeeContact(employeeId)
        if (!mounted) return
        setRole(c.role)
        setEmail(c.email)
        setPhone(c.phone)
        setCpf(c.cpf)
      } catch {
        if (!mounted) return
      } finally {
        if (mounted) setContactLoading(false)
      }
    }

    if (employeeId) loadContact()
    return () => {
      mounted = false
    }
  }, [employeeId])

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        setLoading(true)
        const data = await fetchEmployeeMoodEntries(employeeId, 50)
        if (!mounted) return
        setEntries(Array.isArray(data) ? data : [])
      } catch (e: any) {
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
    const avg = entries.reduce((a, b) => a + Number(b.score ?? 0), 0) / entries.length
    return { avg: Number(avg.toFixed(2)), last: entries[0]?.created_at ?? null }
  }, [entries])

  const chartData = useMemo(() => groupMoodLastDays(entries, 7), [entries])

  // 👉 ANOTAÇÕES = notes do mood_entries
  const notes = useMemo(
    () =>
      entries
        .filter(e => String(e.note ?? '').trim())
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))),
    [entries]
  )

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute inset-0 flex items-start justify-center p-4 sm:p-6">
        <div className="w-full max-w-[420px] bg-white rounded-[2.2rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[14px] font-black text-slate-700">
                  {initials(employeeName)}
                </div>

                <div>
                  <div className="text-[18px] font-black">{employeeName}</div>
                  <div className="text-[11px] font-bold text-slate-500">{contactLoading ? '…' : role}</div>
                </div>
              </div>

              <button onClick={onClose} className="h-10 w-10 rounded-2xl border">✕</button>
            </div>

            {/* CONTATO */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl border bg-slate-50">
                <div className="text-[10px] uppercase text-slate-400">CPF</div>
                <div className="text-[12px] font-black">{cpf || '—'}</div>
              </div>
              <div className="p-4 rounded-2xl border bg-slate-50">
                <div className="text-[10px] uppercase text-slate-400">Telefone</div>
                <div className="text-[12px] font-black">{phone || '—'}</div>
              </div>
            </div>

            <div className="mt-3 p-4 rounded-2xl border">
              <div className="text-[10px] uppercase text-slate-400">E-mail</div>
              <div className="text-[12px] font-black">{email || '—'}</div>
            </div>

            {/* MÉTRICAS */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl border">
                <div className="text-[10px] uppercase text-slate-400">Média</div>
                <div className="text-[22px] font-black">{summary.avg}</div>
              </div>
              <div className="p-4 rounded-2xl border">
                <div className="text-[10px] uppercase text-slate-400">Último registro</div>
                <div className="text-[12px] font-black">
                  {summary.last ? new Date(summary.last).toLocaleString() : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* GRÁFICO */}
          <div className="px-5 pb-5">
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <XAxis dataKey="label" />
                  <YAxis domain={[1, 5]} />
                  <ReTooltip content={<MoodTooltip />} />
                  <Area dataKey="value" stroke="#2563EB" fill="#2563EB22" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* ANOTAÇÕES */}
            <div className="mt-6">
              <div className="text-[13px] font-black">Anotações</div>

              <div className="mt-3 space-y-3">
                {notes.length === 0 && (
                  <div className="text-sm text-slate-400 text-center">Sem anotações.</div>
                )}

                {notes.map(n => (
                  <div key={n.id} className="p-4 rounded-2xl border bg-slate-50">
                    <div className="text-[10px] text-slate-400">
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                    <div className="text-[12px] font-bold mt-1">{n.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* BOTÃO WHATSAPP */}
            <div className="mt-6">
              <button
                onClick={() => openWhatsApp(phone, employeeName)}
                className="w-full h-12 rounded-2xl bg-green-600 text-white font-black hover:bg-green-700"
              >
                ENTRAR EM CONTATO (WHATSAPP)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
