
import React from 'react';
import { Bell, ShieldAlert, CheckCircle2, Search, Filter, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { MOCK_ALERTS, MOCK_EMPLOYEES } from '../constants';
import { Employee } from '../types';

interface AlertsViewProps {
  onSelectEmployee: (employee: Employee) => void;
}

const AlertsView: React.FC<AlertsViewProps> = ({ onSelectEmployee }) => {
  // Simula o vínculo entre um alerta e um funcionário real do MOCK
  const handleViewEmployee = (alertTitle: string) => {
    // Busca um funcionário de tecnologia ou RH conforme o alerta
    const target = MOCK_EMPLOYEES.find(e => 
      alertTitle.includes('Burnout') || e.id === '1' || e.id === '2'
    );
    if (target) onSelectEmployee(target);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Central de Alertas</h2>
          <p className="text-sm text-slate-500 font-medium">Anomalias psicossociais detectadas pelo motor de IA GNR1.</p>
        </div>
        <div className="flex gap-3">
           <button className="text-[10px] font-black uppercase tracking-widest text-blue-600 px-6 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:bg-blue-50 transition-all flex items-center gap-2">
             <CheckCircle2 size={16} /> Marcar tudo como lido
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Ativos', count: 12, icon: <Bell size={18} />, color: 'blue' },
          { label: 'Críticos', count: 5, icon: <AlertTriangle size={18} />, color: 'red' },
          { label: 'Avisos', count: 4, icon: <ShieldAlert size={18} />, color: 'orange' },
          { label: 'Resolvidos', count: 32, icon: <CheckCircle2 size={18} />, color: 'emerald' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
             <div className={`p-3 bg-${stat.color}-50 text-${stat.color}-500 rounded-2xl group-hover:scale-110 transition-transform`}>
                {stat.icon}
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-slate-800">{stat.count}</p>
             </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/20 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Filtrar alertas por ID ou Setor..." className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none focus:border-blue-500 transition-all" />
          </div>
          <button className="bg-white border border-slate-100 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 hover:bg-slate-50 transition-colors">
            <Filter size={16} /> Prioridade
          </button>
        </div>

        <div className="divide-y divide-slate-50">
          {[...MOCK_ALERTS, ...MOCK_ALERTS].map((alert, i) => (
            <div key={`${alert.id}-${i}`} className={`p-8 flex items-start justify-between hover:bg-slate-50/50 transition-all cursor-pointer group ${!alert.read ? 'border-l-4 border-blue-600' : ''}`}>
              <div className="flex gap-6">
                <div className={`p-4 rounded-[1.5rem] shadow-sm ${
                  alert.type === 'critical' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'
                }`}>
                  {alert.type === 'critical' ? <AlertTriangle size={24} /> : <ShieldAlert size={24} />}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="font-black text-lg text-slate-800 tracking-tight">{alert.title}</h4>
                    {!alert.read && <span className="bg-blue-600 text-white text-[8px] font-black uppercase px-2.5 py-1 rounded-md tracking-tighter">Novo Evento</span>}
                  </div>
                  <p className="text-sm text-slate-500 font-medium mt-1.5 max-w-xl leading-relaxed">{alert.description}</p>
                  <div className="flex items-center gap-6 mt-4">
                     <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg">
                        <ArrowUpRight size={12} /> {alert.timestamp}
                     </div>
                     <span className="text-slate-100">|</span>
                     <button 
                        onClick={() => handleViewEmployee(alert.title)}
                        className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-[0.2em] transition-colors"
                     >
                        Ver Perfil do Funcionário
                     </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button className="bg-white border border-slate-100 p-3 rounded-2xl text-slate-400 hover:text-emerald-500 hover:border-emerald-200 hover:shadow-md transition-all">
                  <CheckCircle2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlertsView;
