import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  RotateCcw, 
  Sparkles, 
  Info, 
  Server, 
  Network, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import { api } from '../services/api.js';
import { TopologyGraph } from '../components/Topology/TopologyGraph.jsx';

export function TroubleshootingAssistant({ isSimulated }) {
  const [messages, setMessages] = useState([
    {
      id: 'msg-1',
      sender: 'assistant',
      text: 'Welcome to Network Assistant! I can help you troubleshoot network connectivity issues, analyze DNS resolution, inspect failing devices, and interpret diagnostic results with our rule-based and DFA engines.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadTopology();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadTopology() {
    try {
      const res = await api.getTopology();
      if (res.success) {
        setDevices(res.devices);
        if (res.devices.length > 0) {
          setSelectedDevice(res.devices[0]);
        }
      }
    } catch (e) {
      console.warn('Topology error:', e);
    }
  }

  async function handleSendMessage(textToSend) {
    const text = textToSend || inputQuery;
    if (!text.trim() || loading) return;

    const userMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await api.sendAssistantQuery(text.trim(), { isSimulated });
      
      const assistantMessage = {
        id: 'ast-' + Date.now(),
        sender: 'assistant',
        text: res.reply,
        diagnosticData: res.diagnosticData,
        intent: res.intent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'assistant',
          text: `An error occurred while communicating with the diagnostic engine: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleDeviceStatus(status) {
    if (!selectedDevice) return;
    try {
      const res = await api.updateDeviceStatus(selectedDevice._id, status);
      if (res.success) {
        setSelectedDevice(res.device);
        setDevices((prev) => prev.map(d => d._id === res.device._id ? res.device : d));
      }
    } catch (e) {
      console.error('Failed to update device status:', e);
    }
  }

  const sampleQueries = [
    'Check the network connectivity to google.com',
    'Diagnose DNS problems',
    'Identify devices with connectivity issues',
    'Explain the reason for a failed diagnostic test',
    'Suggest solutions for a port timeout'
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-64px)] flex flex-col space-y-4">
      {/* 2-Panel Layout: Left = Chat (55%), Right = Topology (45%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* LEFT PANEL: Chat Interface */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">Troubleshooting Assistant</h3>
                <p className="text-[10px] text-slate-500">Evidence-Backed Diagnostic Reasoning & FLAT DFA</p>
              </div>
            </div>
            <span className="text-[10px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
              Active Agent
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-lg px-3.5 py-2.5 leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  <span className={`text-[9px] block mt-1.5 ${m.sender === 'user' ? 'text-blue-100 text-right' : 'text-slate-400'}`}>
                    {m.timestamp}
                  </span>
                </div>

                {m.sender === 'user' && (
                  <div className="w-6 h-6 rounded bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                <RotateCcw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Assistant is evaluating diagnostic evidence & transition rules...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-4 py-2 bg-slate-50/70 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] whitespace-nowrap">
            <span className="text-slate-400 font-semibold text-[10px]">Quick Prompts:</span>
            {sampleQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={loading}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-[11px] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask a diagnostic query (e.g. Check connectivity to google.com)..."
              disabled={loading}
              className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputQuery.trim()}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: Network Topology Visualization */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Live Network Topology</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {devices.length} Monitored Nodes
            </span>
          </div>

          {/* Interactive Topology Graph Component */}
          <div className="p-3 flex-1 flex flex-col min-h-0">
            <TopologyGraph
              devices={devices}
              selectedDeviceId={selectedDevice?._id}
              onSelectDevice={(dev) => setSelectedDevice(dev)}
            />

            {/* Selected Device Diagnostic Detail Sheet */}
            {selectedDevice && (
              <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-slate-600" />
                    <span className="font-bold text-slate-800">{selectedDevice.name}</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                    selectedDevice.status === 'active' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : (selectedDevice.status === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')
                  }`}>
                    {selectedDevice.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-mono">
                  <div>IP: <strong className="text-slate-800">{selectedDevice.ip}</strong></div>
                  <div>Type: <strong className="text-slate-800 uppercase">{selectedDevice.deviceType}</strong></div>
                </div>

                <p className="text-[11px] text-slate-500 border-t border-slate-200 pt-1.5">
                  {selectedDevice.details}
                </p>

                {/* Simulated Fault Toggle Controls for Demo */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Simulate Node State:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleDeviceStatus('active')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        selectedDevice.status === 'active' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => handleToggleDeviceStatus('warning')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        selectedDevice.status === 'warning' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      Degraded
                    </button>
                    <button
                      onClick={() => handleToggleDeviceStatus('failed')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        selectedDevice.status === 'failed' ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      Failed
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default TroubleshootingAssistant;
