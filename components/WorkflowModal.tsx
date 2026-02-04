
import React, { useState } from 'react';
import { X, Check, Play, Info, ClipboardList } from 'lucide-react';

interface WorkflowStep {
  step: number;
  title: string;
  description: string;
}

interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: WorkflowStep[];
}

type StepStatus = 'pending' | 'completed';

const WorkflowModal: React.FC<WorkflowModalProps> = ({ isOpen, onClose, steps }) => {
  const [stepsStatus, setStepsStatus] = useState<Record<number, StepStatus>>({});

  if (!isOpen) return null;

  const handleStepClick = (stepNumber: number) => {
    setStepsStatus(prev => ({
      ...prev,
      [stepNumber]: prev[stepNumber] === 'completed' ? 'pending' : 'completed'
    }));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header - Limpo sem IA */}
        <div className="p-8 bg-slate-900 text-white relative">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <ClipboardList size={18} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Gestão Operacional</span>
              </div>
              <h3 className="text-3xl font-black tracking-tight">Workflow de Intervenção</h3>
              <p className="text-slate-400 text-sm mt-2 font-medium">Acompanhe as etapas de resolução para este caso.</p>
            </div>
            <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 space-y-4 bg-slate-50/30">
          <div className="mb-6 p-4 bg-white rounded-2xl border border-slate-100 flex items-start gap-3">
            <Info size={18} className="text-blue-500 mt-0.5" />
            <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
              As etapas abaixo compõem o plano de ação padrão para esta unidade. 
              Clique em cada item para marcar como concluído.
            </p>
          </div>

          {steps.map((item, index) => {
            const isCompleted = stepsStatus[item.step] === 'completed';

            return (
              <div 
                key={index} 
                onClick={() => handleStepClick(item.step)}
                className={`flex gap-6 p-6 rounded-[2rem] border-2 transition-all duration-300 cursor-pointer group hover:shadow-lg active:scale-[0.98] ${
                  isCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm transition-all duration-300 ${
                    isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400 border border-slate-100'
                  }`}>
                    {isCompleted ? <Check size={24} strokeWidth={4} /> : item.step}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-lg font-black tracking-tight transition-colors ${
                      isCompleted ? 'text-emerald-800' : 'text-slate-800'
                    }`}>
                      {item.title}
                    </h4>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      isCompleted ? 'text-emerald-600' : 'text-slate-300'
                    }`}>
                       {isCompleted ? <Check size={14} /> : <Play size={14} />}
                       {isCompleted ? 'Etapa Concluída' : 'Pendente'}
                    </div>
                  </div>
                  <p className={`text-sm font-medium leading-relaxed transition-opacity ${isCompleted ? 'opacity-60' : 'opacity-80'}`}>
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer - Conforme pedido */}
        <div className="p-8 bg-white border-t border-slate-100">
          <button 
            onClick={onClose}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            Fechar Painel de Controle
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowModal;
