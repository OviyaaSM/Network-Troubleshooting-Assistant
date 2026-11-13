import React from 'react';
import { Globe, RefreshCw, Zap } from 'lucide-react';

export function Header({ currentTab, isSimulated, setIsSimulated, onRefresh }) {
  const titles = {
    dashboard: 'Operations Dashboard',
    diagnosis: 'Network Diagnostic Engine',
    topology: 'Local Network Topology',
    assistant: 'Troubleshooting Assistant & Live Topology',
    history: 'Diagnostic Test History & Reports',
    flat: 'FLAT Engine: Regular Expressions & DFA Simulator',
    settings: 'System & Connectivity Settings'
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-slate-800 tracking-tight">
          {titles[currentTab] || 'Network Assistant'}
        </h2>
        <span className="text-xs text-slate-400">|</span>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span>IPv4 Routing & TCP/IP Inspection</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Simulation Mode Toggle Pill */}
        <button
          onClick={() => setIsSimulated(!isSimulated)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-all ${
            isSimulated
              ? 'bg-amber-50 text-amber-700 border-amber-300 font-medium'
              : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
          }`}
          title="Toggle Simulation Mode to safely demonstrate failures without network drops"
        >
          <Zap className={`w-3.5 h-3.5 ${isSimulated ? 'text-amber-600 fill-amber-500' : 'text-slate-400'}`} />
          <span>Mode: {isSimulated ? 'Simulation' : 'Live Network'}</span>
        </button>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
