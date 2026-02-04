
import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle2, Clock, Plus, Sparkles, Target, Calendar, Trash2, PlusCircle, MinusCircle } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  date: string;
  status: string;
  responses: number;
  total: number;
  color: string;
}

const STORAGE_KEY = 'gnr1_campaigns_v1';

const INITIAL_CAMPAIGNS: Campaign[] = [
  { id: 'c1', name: 'Check-in de Acompanhamento Crítico', date: 'Hoje, 09:00', status: 'Em curso', responses: 12, total: 12, color: 'blue' },
  { id: 'c2', name: 'Clima Organizacional - Janeiro', date: '10 Jan, 2026', status: 'Concluído', responses: 48, total: 50, color: 'emerald' },
  { id: 'c3', name: 'Burnout Trimestral (TI)', date: '01 Dez, 2025', status: 'Arquivado', responses: 15, total: 15, color: 'slate' },
];

const EvaluationsView: React.FC = () => {
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  
  const [newName, setNewName] = useState('');
  const [newTotal, setNewTotal] = useState(30);
  const [newDept, setNewDept] = useState('GERAL');

  // Carregar dados salvos ao iniciar
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setCampaigns(JSON.parse(saved));
    } else {
      setCampaigns(INITIAL_CAMPAIGNS);
    }
  }, []);

  // Salvar sempre que mudar
  useEffect(() => {
    if (campaigns.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
    }
  }, [campaigns]);

  const handleCreateCampaign = () => {
    if (!newName) return;
    
    const newCampaign: Campaign = {
      id: Math.random().toString(36).substr(2, 9),
      name: newName,
      date: 'AGORA',
      status: 'Em curso',
      responses: 0,
      total: newTotal,
      color: 'blue'
    };

    setCampaigns([newCampaign, ...campaigns]);
    setIsNewCampaignOpen(false);
    setNewName('');
    setNewTotal(30);
  };

  const removeCampaign = (id: string) => {
    setCampaigns(campaigns.filter(c => c.id !== id));
  };

  const adjustAdhesion = (id: string, amount: number) => {
    setCampaigns(campaigns.map(c => {
      if (c.id === id) {
        const nextVal = Math.max(0, Math.min(c.total, c.responses + amount));
        return { ...c, responses: nextVal, status: nextVal === c.total ? 'Concluído' : 'Em curso' };
      }
      return c;
    }));
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Modal Nova Campanha - ELABORADO E PERSISTENTE */}
      {isNewCampaignOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in">
              <div className="p-8 bg-[#1a1f2e] text-white relative">
                <Sparkles size={40} className="absolute right-8 top-8 text-slate-700" />
                <h3 className="text-3xl font-black tracking-tight">Nova Campanha</h3>
                <p className="text-slate-400 text-xs mt-1 font-medium">Lançamento de pesquisa v1.0.0-PRO</p>
              </div>
              
              <div className="p-10 space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Título da Campanha</label>
                    <input 
                      type="text" 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Ex: Feedback Semanal de Engenharia" 
                      className="w-full p-5 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700" 
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Meta de Respostas</label>
                        <input 
                          type="number" 
                          value={newTotal}
                          onChange={(e) => setNewTotal(parseInt(e.target.value) || 0)}
                          className="w-full p-5 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700" 
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Público</label>
                        <select 
                          className="w-full p-5 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700 appearance-none"
                          value={newDept}
                          onChange={(e) => setNewDept(e.target.value)}
                        >
                          <option>GERAL</option>
                          <option>TECNOLOGIA</option>
                          <option>RH</option>
                        </select>
                    </div>
                 </div>

                 <div className="pt-4 flex items-center justify-between">
                    <button onClick={() => setIsNewCampaignOpen(false)} className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Cancelar</button>
                    <button 
                      onClick={handleCreateCampaign}
                      className="px-10 py-5 bg-[#0f172a] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                    >
                      LANÇAR CAMPANHA
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Avaliações Periódicas</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Gerencie pesquisas e coletas de dados salvos.</p>
        </div>
        <button 
          onClick={() => setIsNewCampaignOpen(true)}
          className="bg-[#0f172a] text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-blue-600 shadow-2xl transition-all active:scale-95"
        >
          <Plus size={18} />
          NOVA CAMPANHA
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/10">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Campanhas em Andamento</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total: {campaigns.length}</span>
        </div>
        <div className="divide-y divide-slate-50">
          {campaigns.map((item) => (
            <div key={item.id} className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
              <div className="flex items-center gap-6">
                <div className={`p-4 bg-${item.color}-50 text-${item.color}-600 rounded-2xl border border-${item.color}-100`}>
                    <ClipboardList size={24} />
                </div>
                <div>
                    <h5 className="font-black text-slate-800 text-lg group-hover:text-blue-600 transition-colors tracking-tight">{item.name}</h5>
                    <div className="flex items-center gap-4 mt-1.5">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{item.date}</p>
                        <button onClick={() => removeCampaign(item.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
              </div>
              <div className="flex items-center gap-12">
                 <div className="text-right flex items-center gap-4">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Adesão</p>
                        <p className="text-sm font-black text-slate-700">{item.responses}/{item.total}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <button onClick={() => adjustAdhesion(item.id, 1)} className="text-blue-600 hover:scale-110 transition-transform"><PlusCircle size={16} /></button>
                        <button onClick={() => adjustAdhesion(item.id, -1)} className="text-slate-300 hover:text-red-400 hover:scale-110 transition-transform"><MinusCircle size={16} /></button>
                    </div>
                 </div>
                 <div className="w-28 text-center">
                    <span className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                      item.status === 'Em curso' ? 'bg-blue-600 text-white' : 
                      item.status === 'Concluído' ? 'bg-emerald-50 text-emerald-600' : 
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {item.status}
                    </span>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EvaluationsView;
