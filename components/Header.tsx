
import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, Search, LayoutGrid, X, User, AlertTriangle, 
  ArrowRight, LogOut, Settings, ShieldCheck, History, ChevronDown 
} from 'lucide-react';
import { MOCK_EMPLOYEES, MOCK_ALERTS } from '../constants';

interface HeaderProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, onLogout }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fecha dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getViewName = (id: string) => {
    const names: Record<string, string> = {
      dashboard: 'Painel Geral',
      employees: 'Colaboradores',
      evaluations: 'Pesquisas Ativas',
      reports: 'Central de Dados',
      alerts: 'Notificações',
      settings: 'Ajustes'
    };
    return names[id] || 'Início';
  };

  // Lógica de busca global simplificada
  const filteredEmployees = MOCK_EMPLOYEES.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 3);

  const filteredAlerts = MOCK_ALERTS.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 2);

  return (
    <header className="flex justify-between items-center py-6 px-10 bg-white/80 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-100 transition-all duration-300">
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
            <LayoutGrid size={18} />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{getViewName(currentView)}</h2>
        </div>
        
        {/* BARRA DE BUSCA HABILITADA */}
        <div className="hidden lg:flex items-center relative group">
          <Search size={16} className={`absolute left-4 transition-colors ${searchQuery ? 'text-blue-600' : 'text-slate-400'}`} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(e.target.value.length > 0);
            }}
            onFocus={() => searchQuery.length > 0 && setShowSearchResults(true)}
            placeholder="Buscar dados no sistema..." 
            className="pl-12 pr-10 py-3 bg-white border border-blue-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 rounded-2xl text-xs w-80 outline-none transition-all font-semibold text-slate-600 shadow-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(''); setShowSearchResults(false); }}
              className="absolute right-4 text-slate-300 hover:text-slate-500"
            >
              <X size={14} />
            </button>
          )}

          {/* RESULTADOS DA BUSCA (OVERLAY) */}
          {showSearchResults && (
            <div className="absolute top-full left-0 mt-3 w-[400px] bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-fade-in z-[100]">
               <div className="p-5 border-b border-slate-50 bg-slate-50/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resultados da Busca Inteligente</p>
               </div>
               <div className="p-2 max-h-[400px] overflow-y-auto">
                  {filteredEmployees.length > 0 && (
                    <div className="mb-2">
                       <p className="px-4 py-2 text-[9px] font-black text-blue-500 uppercase tracking-tighter">Colaboradores</p>
                       {filteredEmployees.map(emp => (
                         <div key={emp.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl cursor-pointer transition-colors group">
                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-[10px] font-black uppercase">{emp.name.charAt(0)}</div>
                            <div className="flex-1">
                               <p className="text-xs font-bold text-slate-700">{emp.name}</p>
                               <p className="text-[10px] text-slate-400">{emp.department}</p>
                            </div>
                            <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 text-blue-500 transition-all" />
                         </div>
                       ))}
                    </div>
                  )}
                  {filteredAlerts.map(alert => (
                    <div key={alert.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl cursor-pointer transition-colors group border-t border-slate-50">
                       <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center"><AlertTriangle size={14} /></div>
                       <div className="flex-1">
                          <p className="text-xs font-bold text-slate-700">{alert.title}</p>
                          <p className="text-[10px] text-slate-400">Alerta de Sistema</p>
                       </div>
                    </div>
                  ))}
                  {filteredEmployees.length === 0 && filteredAlerts.length === 0 && (
                    <div className="p-10 text-center">
                       <p className="text-xs text-slate-400 font-medium italic">Nenhum dado encontrado para "{searchQuery}"</p>
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* NOTIFICAÇÕES HABILITADAS */}
        <div className="relative" ref={notificationRef}>
          <div 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`p-3.5 rounded-2xl transition-all cursor-pointer border shadow-sm ${
              isNotificationsOpen ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-slate-50 text-slate-400 border-slate-100'
            }`}
          >
            <Bell size={20} />
          </div>
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-xl border-[3px] border-white shadow-lg pointer-events-none">
            3
          </span>

          {/* DROPDOWN DE NOTIFICAÇÕES */}
          {isNotificationsOpen && (
            <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h4 className="font-black text-slate-800 text-sm">Notificações</h4>
                <span className="text-[10px] font-black text-blue-600 uppercase">3 Novas</span>
              </div>
              <div className="p-2 space-y-1">
                {MOCK_ALERTS.map((alert) => (
                  <div key={alert.id} className="p-4 hover:bg-slate-50 rounded-2xl cursor-pointer transition-colors group">
                    <div className="flex gap-3">
                       <div className={`p-2 rounded-xl h-fit ${alert.type === 'critical' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                          <AlertTriangle size={16} />
                       </div>
                       <div>
                          <p className="text-xs font-black text-slate-800 tracking-tight">{alert.title}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{alert.description}</p>
                          <p className="text-[9px] font-bold text-slate-300 mt-2 uppercase">{alert.timestamp}</p>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => { onNavigate('alerts'); setIsNotificationsOpen(false); }}
                className="w-full p-4 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 transition-colors border-t border-slate-50"
              >
                Ver todas as notificações
              </button>
            </div>
          )}
        </div>
        
        <div className="h-10 w-[1px] bg-slate-100 mx-2" />

        {/* PERFIL DO GESTOR COM MENU CLICÁVEL */}
        <div className="relative" ref={profileRef}>
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center gap-4 cursor-pointer group px-3 py-2 rounded-[1.5rem] transition-all border ${
              isProfileOpen ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'hover:bg-slate-50 bg-white border-slate-100 shadow-sm'
            }`}
          >
            <div className="text-right hidden sm:block">
              <p className={`text-sm font-black transition-colors ${isProfileOpen ? 'text-white' : 'text-slate-900 group-hover:text-blue-600'}`}>Admin Gestor</p>
              <p className="text-[9px] text-emerald-500 uppercase tracking-widest font-black flex items-center justify-end gap-1">
                Conectado <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              </p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
              isProfileOpen ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 border border-white shadow-inner'
            }`}>
              AG
            </div>
            <ChevronDown size={14} className={`transition-transform duration-300 ${isProfileOpen ? 'rotate-180 text-blue-400' : 'text-slate-300'}`} />
          </div>

          {/* MENU DROPDOWN DO GESTOR */}
          {isProfileOpen && (
            <div className="absolute top-full right-0 mt-3 w-72 bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden animate-fade-in z-50">
              {/* Profile Header in Menu */}
              <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-sm">AG</div>
                   <div>
                      <p className="text-sm font-black text-slate-800">Admin Gestor</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: #BRA-01-2026</p>
                   </div>
                </div>
                <div className="mt-4 flex gap-2">
                   <div className="flex-1 bg-white p-2 rounded-xl border border-slate-100 text-center">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Sessão</p>
                      <p className="text-[10px] font-bold text-slate-700">Ativa</p>
                   </div>
                   <div className="flex-1 bg-white p-2 rounded-xl border border-slate-100 text-center">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Nível</p>
                      <p className="text-[10px] font-bold text-blue-600">Enterprise</p>
                   </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                 <button 
                  onClick={() => { onNavigate('settings'); setIsProfileOpen(false); }}
                  className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 rounded-2xl transition-colors group text-left"
                 >
                    <div className="p-2 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      <User size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Ver Meu Perfil</span>
                 </button>

                 <button 
                  onClick={() => { onNavigate('settings'); setIsProfileOpen(false); }}
                  className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 rounded-2xl transition-colors group text-left"
                 >
                    <div className="p-2 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      <History size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Log de Auditoria</span>
                 </button>

                 <div className="h-px bg-slate-50 my-1 mx-4" />

                 <button 
                  onClick={() => { onLogout(); setIsProfileOpen(false); }}
                  className="w-full flex items-center justify-between p-4 hover:bg-red-50 rounded-2xl transition-colors group text-left"
                 >
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-red-50 text-red-400 rounded-xl group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                         <LogOut size={16} />
                       </div>
                       <span className="text-xs font-bold text-red-500 group-hover:text-red-600">Encerrar Sessão</span>
                    </div>
                    <ShieldCheck size={14} className="text-slate-200 group-hover:text-red-200" />
                 </button>
              </div>

              <div className="p-4 bg-slate-900 text-center">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Criptografia GNR1 Ativa</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
