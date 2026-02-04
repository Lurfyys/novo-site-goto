// src/views/EmployeesView.tsx
import React, { useEffect, useMemo, useState } from 'react'
import EmployeeTable from '../components/EmployeeTable'
import EmployeeProfilePanel from '../components/EmployeeProfilePanel'
import {
  fetchAllEmployees,
  fetchMyProfile,
  // fetchEmployeesByCompany, // <- use depois se quiser filtrar
  type EmployeeRow
} from '../services/employeesService'

type EmployeeUI = {
  id: string
  name: string
  entries: number
  company_id: string | null
}

export default function EmployeesView() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<EmployeeRow[]>([])
  const [query, setQuery] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeUI | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        setLoading(true)
        setError(null)

        // ✅ garante login e não quebra por causa de "user_id"
        await fetchMyProfile()
        if (!mounted) return

        // ✅ GLOBAL: todos os funcionários (todas empresas)
        const employees = await fetchAllEmployees()

        if (!mounted) return
        setRows(Array.isArray(employees) ? employees : [])
      } catch (e: any) {
        console.error('EmployeesView load error:', e)
        if (!mounted) return
        setRows([])
        setError(e?.message ?? 'Erro ao carregar funcionários.')
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
    const mapped = (rows ?? []).map(r => ({
      id: r.user_id,
      name: r.name ?? 'Sem nome',
      entries: Number(r.entries ?? 0),
      company_id: r.company_id ?? null
    }))

    const q = query.trim().toLowerCase()
    if (!q) return mapped

    return mapped.filter(e => {
      return (
        e.name.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        (e.company_id ?? '').toLowerCase().includes(q)
      )
    })
  }, [rows, query])

  const activeCount = useMemo(() => {
    return (rows ?? []).filter(r => Number(r.entries ?? 0) > 0).length
  }, [rows])

  function onSelectEmployee(emp: EmployeeUI) {
    setSelectedEmployee(emp)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800">Gestão de Funcionários</h2>
        <p className="text-sm text-slate-500">
          Mostrando todos os funcionários cadastrados (ativos e sem registros).
        </p>
      </div>

      {/* Erro */}
      {error && (
        <div className="p-4 rounded-2xl border border-red-100 bg-red-50 text-red-700 text-sm font-bold">
          {error}
        </div>
      )}

      {/* Busca */}
      <div className="flex justify-end">
        <div className="relative w-full max-w-sm">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar colaborador..."
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-200 text-sm"
          />
        </div>
      </div>

      {/* Tabela */}
      <EmployeeTable employees={employeesUI} onSelectEmployee={onSelectEmployee} />

      {/* Rodapé */}
      <div className="text-xs text-slate-400 font-bold">
        Total cadastrados: {rows.length} • Ativos (com registros): {activeCount}
        {loading ? ' • Carregando…' : ''}
      </div>

      {/* Painel */}
      {selectedEmployee && (
        <EmployeeProfilePanel
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  )
}
