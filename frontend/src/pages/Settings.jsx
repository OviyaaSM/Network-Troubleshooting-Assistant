import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Server, 
  Database, 
  ShieldCheck, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api.js';

export function Settings({ isSimulated, setIsSimulated }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBackendHealth();
  }, []);

  async function checkBackendHealth() {
    try {
      setLoading(true);
      const res = await api.checkHealth();
      setHealth(res);
    } catch (e) {
      setHealth({ status: 'unreachable', error: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Settings Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <SettingsIcon className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-base font-bold text-slate-800">System & Diagnostics Configuration</h2>
            <p className="text-xs text-slate-500">
              Manage network diagnostic parameters, active environment bindings, and runtime modes.
            </p>
          </div>
        </div>
      </div>

      {/* Backend Health & Deployment Info */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
          Backend Runtime Status (Vercel Serverless / Node.js)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Service Health</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              <span className="font-bold text-slate-800 capitalize">{health?.status || 'Connecting...'}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Target Architecture</span>
            <div className="font-bold text-slate-800 mt-1">
              {health?.serverless ? 'Vercel Serverless Function' : 'Express Node.js Container'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Frontend Deployment</span>
            <div className="font-bold text-slate-800 mt-1">
              Render Static Site (Vite React)
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Default Mode */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
          Diagnostic Execution Mode
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-800">Controlled Simulation Mode</div>
            <p className="text-[11px] text-slate-500">
              When enabled, simulates reproducible failure scenarios (e.g. DNS NXDOMAIN, port drop, gateway disconnect) for classroom presentations.
            </p>
          </div>

          <button
            onClick={() => setIsSimulated(!isSimulated)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              isSimulated ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
            }`}
          >
            <span className="bg-white w-4 h-4 rounded-full shadow-md transform"></span>
          </button>
        </div>
      </div>

      {/* Project & Academic Metadata */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3 text-xs text-slate-600">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
          About Automated Network Troubleshooting Assistant
        </h3>
        <p className="leading-relaxed">
          Designed and engineered as a full-stack, automated network troubleshooting system combining empirical Computer Networks diagnostics (IPv4 addressing, DNS, TCP handshakes, HTTP status codes, routing hop reachability) with Formal Languages and Automata Theory (FLAT) regular expressions and deterministic finite state machines.
        </p>
        <div className="pt-2 text-[11px] text-slate-400">
          GitHub Repository: <a href="https://github.com/OviyaaSM/Network-Troubleshooting-Assistant" target="_blank" rel="noreferrer" className="text-blue-600 underline">OviyaaSM/Network-Troubleshooting-Assistant</a>
        </div>
      </div>
    </div>
  );
}

export default Settings;
