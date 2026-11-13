import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Server, 
  Globe, 
  Router, 
  Laptop, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Sliders
} from 'lucide-react';
import { api } from '../services/api.js';
import { TopologyGraph } from '../components/Topology/TopologyGraph.jsx';

export function NetworkTopology() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);

  useEffect(() => {
    loadTopology();
  }, []);

  async function loadTopology() {
    try {
      setLoading(true);
      const res = await api.getTopology();
      if (res.success) {
        setDevices(res.devices);
        if (!selectedDevice && res.devices.length > 0) {
          setSelectedDevice(res.devices[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load topology:', e);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(deviceId, status) {
    try {
      const res = await api.updateDeviceStatus(deviceId, status);
      if (res.success) {
        setDevices(prev => prev.map(d => d._id === deviceId ? res.device : d));
        if (selectedDevice && selectedDevice._id === deviceId) {
          setSelectedDevice(res.device);
        }
      }
    } catch (e) {
      console.error('Failed to update device:', e);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Topology Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">Hierarchical Network Topology</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visual inspection of gateway, distribution switch, core servers, and client workstations.
          </p>
        </div>

        <button
          onClick={loadTopology}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Map</span>
        </button>
      </div>

      {/* Main Canvas & Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Topology Visualization Canvas */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col">
          <TopologyGraph
            devices={devices}
            selectedDeviceId={selectedDevice?._id}
            onSelectDevice={(dev) => setSelectedDevice(dev)}
          />
        </div>

        {/* Device Information & Fault Injection Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Device Inspector
            </h3>

            {selectedDevice ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Device Name</span>
                  <div className="text-sm font-bold text-slate-800">{selectedDevice.name}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block font-sans">IP Address</span>
                    <span className="text-slate-800 font-semibold">{selectedDevice.ip}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block font-sans">Device Role</span>
                    <span className="text-slate-800 uppercase font-semibold">{selectedDevice.deviceType}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Hardware / Service Info</span>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] leading-relaxed">
                    {selectedDevice.details}
                  </p>
                </div>

                {/* State Control */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-2">
                    Simulate Device State
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => updateStatus(selectedDevice._id, 'active')}
                      className={`py-1.5 rounded text-xs font-bold transition-colors ${
                        selectedDevice.status === 'active' 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => updateStatus(selectedDevice._id, 'warning')}
                      className={`py-1.5 rounded text-xs font-bold transition-colors ${
                        selectedDevice.status === 'warning' 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Degraded
                    </button>
                    <button
                      onClick={() => updateStatus(selectedDevice._id, 'failed')}
                      className={`py-1.5 rounded text-xs font-bold transition-colors ${
                        selectedDevice.status === 'failed' 
                          ? 'bg-rose-600 text-white' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Offline
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Select any device on the network map to inspect.</p>
            )}
          </div>

          {/* Quick Topology Legend */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600 space-y-2">
            <div className="font-semibold text-slate-800 text-xs">Topology Architecture Notes</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Demonstrates Layer 3 subnet routing and Layer 2 switched star topology connecting local workstations and application servers to the default gateway.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NetworkTopology;
