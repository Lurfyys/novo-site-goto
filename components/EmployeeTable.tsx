import React from 'react'

type EmployeeUI = {
  id: string
  name: string
  entries: number
}

type Props = {
  employees: EmployeeUI[]
  onSelectEmployee?: (emp: EmployeeUI) => void
}

const EmployeeTable: React.FC<Props> = ({ employees, onSelectEmployee }) => {
  const activeCount = employees.filter(e => (e.entries ?? 0) > 0).length

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[13px] font-bold text-slate-700">Funcionários</div>
        <div className="text-[11px] font-black text-slate-400">{activeCount} ATIVOS</div>
      </div>

      {employees.length === 0 ? (
        <div className="h-[120px] flex items-center justify-center text-slate-300 text-sm font-bold">
          Nenhum funcionário encontrado.
        </div>
      ) : (
        <div className="space-y-3">
          {employees.map(emp => (
            <div
              key={emp.id}
              className="p-4 rounded-2xl border border-slate-100 hover:shadow-sm transition flex items-center justify-between"
            >
              <div>
                <div className="text-[13px] font-black text-slate-800">{emp.name}</div>
                <div className="text-[11px] font-bold text-slate-400">
                  Registros: {emp.entries} • ID: {emp.id.slice(0, 8)}…
                </div>
              </div>

              <button
                onClick={() => onSelectEmployee?.(emp)}
                className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-white border border-slate-100 text-blue-600"
              >
                Ver perfil →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default EmployeeTable
