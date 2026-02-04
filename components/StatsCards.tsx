// src/components/StatsCards.tsx
import React from 'react'
import { Shield, Users, AlertTriangle, ChevronRight } from 'lucide-react'

interface StatsCardsProps {
  onRiskClick?: () => void
  onTrackingClick?: () => void
  onAlertsClick?: () => void

  trackingCount?: number
  riskLabel?: string
  riskHint?: string
  riskTag?: string

  criticalCount?: number
}

const StatsCards: React.FC<StatsCardsProps> = ({
  onRiskClick,
  onTrackingClick,
  onAlertsClick,
  trackingCount = 0,
  riskLabel = '—',
  riskHint = 'Sem dados suficientes',
  riskTag = '—',
  criticalCount = 0
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Risco Psicossocial */}
      <div
        onClick={onRiskClick}
        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group cursor-pointer"
      >
        <div className="absolute top-6 right-6 p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:text-orange-600 transition-colors">
          <ChevronRight size={18} />
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl group-hover:scale-110 transition-transform">
            <Shield size={20} fill="currentColor" fillOpacity={0.2} />
          </div>
          <span className="text-[13px] font-bold text-slate-700">Risco Psicossocial</span>
        </div>

        <div className="flex justify-between items-end">
          <div>
            <h4 className="text-3xl font-black text-slate-800 tracking-tight">{riskLabel}</h4>
            <p className="text-[11px] font-bold text-slate-400 mt-1">{riskHint}</p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 rounded-xl shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-red-500">{riskTag}</span>
          </div>
        </div>
      </div>

      {/* Alertas Críticos */}
      <div
        onClick={onAlertsClick}
        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group cursor-pointer"
      >
        <div className="absolute top-6 right-6 p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:text-rose-600 transition-colors">
          <ChevronRight size={18} />
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
            <AlertTriangle size={20} />
          </div>
          <span className="text-[13px] font-bold text-slate-700">Alertas Críticos</span>
        </div>

        <div className="flex justify-between items-end">
          <div>
            <h4 className="text-3xl font-black text-slate-800 tracking-tight">{criticalCount}</h4>
            <p className="text-[11px] font-bold text-slate-400 mt-1">Últimos 7 dias</p>
          </div>

          <div className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-100">
            PRIORIDADE
          </div>
        </div>
      </div>

      {/* Funcionários ativos */}
      <div
        onClick={onTrackingClick}
        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group cursor-pointer"
      >
        <div className="absolute top-6 right-6 p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:text-emerald-600 transition-colors">
          <ChevronRight size={18} />
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
            <Users size={20} />
          </div>
          <span className="text-[13px] font-bold text-slate-700">Funcionários ativos</span>
        </div>

        <div className="flex justify-between items-end">
          <div>
            <h4 className="text-3xl font-black text-slate-800 tracking-tight">{trackingCount}</h4>
            <p className="text-[11px] font-bold text-slate-400 mt-1">Com registros no app</p>
          </div>

          <div className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            ✓ ATIVO
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatsCards
