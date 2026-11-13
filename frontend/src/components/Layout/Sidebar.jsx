import React from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  Network, 
  Bot, 
  History, 
  Binary, 
  Settings as SettingsIcon,
  ShieldCheck
} from 'lucide-react';

export function Sidebar({ currentTab, setTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'diagnosis', label: 'Network Diagnosis', icon: Activity },
    { id: 'topology', label: 'Network Topology', icon: Network },
    { id: 'assistant', label: 'Troubleshooting Assistant', icon: Bot },
    { id: 'history', label: 'Diagnostic History', icon: History },
    { id: 'flat', label: 'FLAT Engine & DFA', icon: Binary },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 select-none flex-shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800 gap-3">
        <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white shadow-sm font-bold text-sm tracking-wide">
          NA
        </div>
        <div>
          <h1 className="text-sm font-semibold text-white tracking-tight leading-tight">NetAssistant</h1>
          <p className="text-[11px] text-slate-400 font-medium">Diagnostic & FLAT Suite</p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Environment Status */}
      <div className="p-3 border-t border-slate-800">
        <div className="bg-slate-800/80 rounded px-3 py-2 border border-slate-700/60 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-300 font-medium">System Online</span>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">v1.0</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
