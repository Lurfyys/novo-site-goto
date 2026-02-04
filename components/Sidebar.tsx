
import React from 'react';
import { Activity } from 'lucide-react';
import { SIDEBAR_ITEMS } from '../constants';

interface SidebarProps {
  activeId: string;
  onNavigate: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeId, onNavigate }) => {
  return (
    <div className="fixed top-0 left-0 h-full w-64 bg-white text-slate-600 p-8 flex flex-col z-50 border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
          <Activity size={24} className="text-white" />
        </div>
        <div>
          <h1 className="font-black text-slate-900 text-xl tracking-tighter">GNR1</h1>
          <p className="text-[9px] text-blue-500 uppercase tracking-[0.3em] font-black leading-none">Intelligence</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-blue-600 text-white font-bold shadow-xl shadow-blue-500/20' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className={`transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`}>
                {item.icon}
              </span>
              <span className="text-sm font-semibold tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="pt-8 border-t border-slate-100 flex flex-col gap-6">
        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">SISTEMA GNR1</p>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600">UNIDADE BRA-01</span>
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-40" />
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center text-[9px] text-slate-300 uppercase tracking-widest font-black px-2">
          <span>CORPORATIVO</span>
          <span>© 2026</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
