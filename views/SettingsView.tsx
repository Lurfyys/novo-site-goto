
import React, { useState, useEffect } from 'react';
import { 
  User, Bell, Lock, Globe, CheckCircle2, 
  ChevronRight, Mail, Slack, Database, UserPlus, 
  ShieldAlert, Laptop, Link2, Shield
} from 'lucide-react';

const ADMIN_STORAGE_KEY = 'gnr1_admins_v1';

const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Perfil');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('GESTOR');
  const [admins, setAdmins] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (saved) setAdmins(JSON.parse(saved));
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 800);
  };

  const handleInviteAdmin = () => {
    if(!newAdminEmail) return;
    setIsSaving(true);
    setTimeout(() => {
      const newAdmin = { email: newAdminEmail, role: newAdminRole, date: new Date().toLocaleDateString() };
      const updatedAdmins = [newAdmin, ...admins];
      setAdmins(updatedAdmins);
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(updatedAdmins));
      
      setIsSaving(false);
      setIsAddAdminModalOpen(false);
      setShowToast(true);
      setNewAdminEmail('');
    }, 1200);
  };

  const menuItems = [
    { label: 'Perfil', icon: <User size={18} />, desc: 'Dados e cargo' },
    { label: 'Notificações', icon: <Bell size={18} />, desc: 'Alertas de sistema' },
    { label: 'Segurança', icon: <Lock size={18} />, desc: 'Senha e 2FA' },
    { label: 'Integrações', icon: <Globe size={18} />, desc: 'Workspace connect' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in relative pb-20">
      
      {/* Modal: Novo Administrador - IDÊNTICO AO PRINT */}
      {isAddAdminModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-fade-in border border-white">
              {/* Header Escuro */}
              <div className="p-10 bg-[#1a1f2e] text-white relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-12 -mt-12" />
                <h3 className="text-3xl font-black tracking-tight">Novo Administrador</h3>
                <p className="text-slate-400 text-sm mt-1 font-medium">Conceda privilégios de gestão na unidade GNR1.</p>
              </div>

              <div className="p-10 space-y-8">
                 {/* Input E-mail */}
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">E-MAIL CORPORATIVO</label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                      <input 
                        type="email" 
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        placeholder="nome@empresa.com" 
                        className="w-full pl-14 pr-5 py-5 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700" 
                      />
                    </div>
                 </div>

                 {/* Seleção Nível de Acesso */}
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">NÍVEL DE ACESSO</label>
                    <div className="grid grid-cols-3 gap-3">
                       {['ROOT', 'GESTOR', 'AUDITOR'].map(role => (
                         <button 
                          key={role} 
                          onClick={() => setNewAdminRole(role)}
                          className={`py-4 rounded-xl text-[10px] font-black uppercase border transition-all ${
                            newAdminRole === role ? 'bg-[#1a1f2e] text-white border-[#1a1f2e]' : 'bg-white border-slate-100 text-slate-400'
                          }`}
                         >
                           {role}
                         </button>
                       ))}
                    </div>
                 </div>

                 {/* Info Box Azul Clara */}
                 <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                    <Shield size={18} className="text-blue-600 mt-0.5" />
                    <p className="text-[11px] font-bold text-blue-900 leading-relaxed">
                      O novo administrador receberá um convite por e-mail para configurar sua chave RSA.
                    </p>
                 </div>

                 {/* Footer Botões */}
                 <div className="pt-4 flex items-center justify-between">
                    <button 
                      onClick={() => setIsAddAdminModalOpen(false)} 
                      className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-slate-600 transition-colors"
                    >
                      DESISTIR
                    </button>
                    <button 
                      onClick={handleInviteAdmin}
                      className="px-12 py-5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                    >
                      ENVIAR CONVITE
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showToast && (
        <div className="fixed top-24 right-10 bg-slate-900 text-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-4 animate-fade-in z-[100] border border-slate-700">
           <CheckCircle2 className="text-emerald-500" size={20} />
           <span className="font-bold text-sm">Operação realizada com sucesso!</span>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Configurações</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Gestão administrativa v1.0.0-PRO.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-4 space-y-3">
          {menuItems.map((item) => (
            <button 
              key={item.label}
              onClick={() => setActiveTab(item.label)}
              className={`w-full flex items-center justify-between p-5 rounded-[2.5rem] text-sm font-bold transition-all border ${
                activeTab === item.label 
                  ? 'bg-white border-blue-600 text-blue-600 shadow-xl' 
                  : 'bg-transparent border-transparent text-slate-400 hover:bg-white hover:border-slate-100 hover:text-slate-600'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${activeTab === item.label ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                  {item.icon}
                </div>
                <div className="text-left">
                  <p className="text-sm font-black tracking-tight">{item.label}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5 opacity-60">{item.desc}</p>
                </div>
              </div>
              {activeTab === item.label && <ChevronRight size={14} />}
            </button>
          ))}

          {/* CARD PLANO CORPORATE */}
          <div className="p-8 bg-[#1a1f2e] rounded-[3rem] mt-8 text-white relative overflow-hidden group border border-slate-800 shadow-2xl">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-1000 border border-white/5" />
             <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-3">Plano Corporate</p>
             <h4 className="text-xl font-black tracking-tight mb-8">GNR1 Enterprise</h4>
             <button 
               onClick={() => setIsAddAdminModalOpen(true)}
               className="w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-slate-700 px-6 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 border border-white/5"
             >
                <UserPlus size={18} /> ADICIONAR NOVO ADMIN
             </button>
          </div>
        </aside>

        <div className="lg:col-span-8 bg-white p-1 rounded-[3.5rem] border border-slate-100 shadow-xl min-h-[600px] flex flex-col overflow-hidden relative">
          
          <div className="flex-1 p-10 space-y-8">
            {activeTab === 'Integrações' && (
                <div className="space-y-8 animate-fade-in">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Workspace Connect</h3>
                        <p className="text-xs text-slate-400 font-medium mt-1">Conecte o GNR1 aos seus canais de comunicação e RH.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { name: 'Slack', icon: <Slack className="text-[#4A154B]" />, desc: 'Alertas e check-ins diretos.', status: 'Conectado', action: 'Configurar' },
                            { name: 'Microsoft Teams', icon: <Laptop className="text-[#6264A7]" />, desc: 'Integração via Bot GNR1.', status: 'Disponível', action: 'Conectar' },
                            { name: 'Sistema de RH', icon: <Database className="text-blue-500" />, desc: 'Sincronização de base ativa.', status: 'Ativo', action: 'Sincronizar' },
                            { name: 'Workspace API', icon: <Link2 className="text-slate-400" />, desc: 'Integrações customizadas.', status: 'Acesso Livre', action: 'Gerar Chave' }
                        ].map((int, i) => (
                            <div key={i} className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 hover:border-blue-200 transition-all group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">{int.icon}</div>
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${int.status === 'Conectado' || int.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                        {int.status}
                                    </span>
                                </div>
                                <h4 className="font-black text-slate-800 text-sm tracking-tight">{int.name}</h4>
                                <p className="text-[11px] text-slate-400 font-medium mt-1 mb-6 leading-relaxed">{int.desc}</p>
                                <button className="w-full py-3 bg-white border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-blue-600 hover:text-white transition-all">
                                    {int.action}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'Perfil' && (
                <div className="space-y-10 animate-fade-in">
                    <div className="flex items-center gap-8 border-b border-slate-50 pb-10">
                        <div className="w-24 h-24 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center text-3xl font-black shadow-xl shadow-blue-500/20">AG</div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Admin Gestor</h3>
                            <p className="text-sm text-slate-500 font-medium">Unidade BRA-01 • Versão 1.0.0-PRO</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">E-MAIL DE TRABALHO</label>
                        <input type="email" defaultValue="gestor@gmail.com" className="w-full bg-slate-50 border border-slate-100 focus:border-blue-600 focus:bg-white px-6 py-5 rounded-2xl text-sm font-bold text-slate-700 transition-all outline-none" />
                        </div>
                        <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">CARGO</label>
                        <input type="text" defaultValue="Gestor de Operações" className="w-full bg-slate-50 border border-slate-100 focus:border-blue-600 focus:bg-white px-6 py-5 rounded-2xl text-sm font-bold text-slate-700 transition-all outline-none" />
                        </div>
                    </div>
                </div>
            )}
          </div>

          <div className="p-10 bg-white border-t border-slate-50">
            <button 
              onClick={handleSave}
              className="w-full bg-[#0f172a] text-white py-6 rounded-[1.8rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-blue-600 transition-all active:scale-[0.98]"
            >
              CONFIRMAR ALTERAÇÕES
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
