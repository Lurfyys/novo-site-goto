
import React from 'react';
import { X, ShieldAlert, Zap, BarChart3, Target } from 'lucide-react';

interface RiskFactor {
  factor: string;
  impact: string;
  mitigation: string;
}

interface RiskAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    summary?: string;
    factors?: RiskFactor[];
  };
}

const RiskAnalysisModal: React.FC<RiskAnalysisModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-xl animate-fade-in">
      <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-10 bg-gradient-to-br from-orange-500 to-red-600 text-white relative">
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <ShieldAlert size={140} />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full mb-4">
                <Zap size={14} className="text-yellow-300" />
                <span className="text-[10px] font-black uppercase tracking-widest">Análise de Risco Profunda</span>
              </div>
              <h3 className="text-4xl font-black tracking-tighter">Diagnóstico Organizacional</h3>
              <p className="text-orange-100 text-sm mt-2 font-medium opacity-90 max-w-lg">{data.summary}</p>
            </div>
            <button onClick={onClose} className="p-4 bg-white/10 hover:bg-white/20 rounded-[1.5rem] transition-all">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.factors?.map((f, i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl mb-4 ${
                  f.impact === 'Alto' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'
                }`}>
                  <BarChart3 size={20} />
                </div>
                <h4 className="text-sm font-black text-slate-800 mb-2">{f.factor}</h4>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                    f.impact === 'Alto' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                    Impacto {f.impact}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{f.mitigation}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
             <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-600 rounded-2xl">
                   <Target size={24} />
                </div>
                <div>
                   <h4 className="text-xl font-black tracking-tight">Próximos Passos Sugeridos</h4>
                   <p className="text-xs text-slate-400 font-medium">Recomendações estratégicas imediatas.</p>
                </div>
             </div>
             <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm font-medium text-slate-300">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
                   Agendar reuniões de alinhamento com lideranças de departamentos críticos.
                </li>
                <li className="flex items-start gap-3 text-sm font-medium text-slate-300">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
                   Implementar canais de escuta ativa anônima para coletar feedbacks qualitativos.
                </li>
             </ul>
          </div>
        </div>

        <div className="p-8 bg-white border-t border-slate-100 flex gap-4">
          <button 
            onClick={onClose}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            Entendido, Fechar Diagnóstico
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiskAnalysisModal;
