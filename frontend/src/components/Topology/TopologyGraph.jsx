import React, { useState } from 'react';
import { 
  Globe, 
  Router, 
  Network as SwitchIcon, 
  Server, 
  Laptop, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  Info 
} from 'lucide-react';

export function TopologyGraph({ devices = [], onSelectDevice, selectedDeviceId }) {
  const [hoveredNode, setHoveredNode] = useState(null);

  // Position devices in a clean hierarchical tree
  // Layer 0: Internet Gateway (WAN)
  // Layer 1: Core Router
  // Layer 2: Main Switch & DNS Server
  // Layer 3: Workstations & Web Server
  const nodePositions = {
    'dev-1': { x: 300, y: 40, layer: 0 },
    'dev-2': { x: 300, y: 130, layer: 1 },
    'dev-3': { x: 220, y: 220, layer: 2 },
    'dev-4': { x: 420, y: 220, layer: 2 },
    'dev-5': { x: 120, y: 310, layer: 3 },
    'dev-6': { x: 230, y: 310, layer: 3 },
    'dev-7': { x: 340, y: 310, layer: 3 },
  };

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'gateway': return Globe;
      case 'router': return Router;
      case 'switch': return SwitchIcon;
      case 'server': return Server;
      default: return Laptop;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return { stroke: '#10b981', fill: '#d1fae5', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' };
      case 'warning': return { stroke: '#f59e0b', fill: '#fef3c7', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' };
      case 'failed':
      case 'offline': return { stroke: '#ef4444', fill: '#fee2e2', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800' };
      default: return { stroke: '#64748b', fill: '#f1f5f9', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-700' };
    }
  };

  // Build SVG links between connected devices
  const links = [];
  devices.forEach((dev) => {
    const sourcePos = nodePositions[dev._id];
    if (sourcePos && dev.connections) {
      dev.connections.forEach((targetId) => {
        const targetPos = nodePositions[targetId];
        const targetDev = devices.find(d => d._id === targetId);
        if (targetPos) {
          // Link status depends on both devices being active
          const linkFailed = dev.status === 'failed' || (targetDev && targetDev.status === 'failed');
          const linkWarning = dev.status === 'warning' || (targetDev && targetDev.status === 'warning');
          const strokeColor = linkFailed ? '#ef4444' : (linkWarning ? '#f59e0b' : '#10b981');

          links.push({
            id: `${dev._id}-${targetId}`,
            x1: sourcePos.x,
            y1: sourcePos.y + 20,
            x2: targetPos.x,
            y2: targetPos.y - 20,
            stroke: strokeColor,
            isFailed: linkFailed
          });
        }
      });
    }
  });

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-50/50 rounded-lg border border-slate-200 overflow-hidden flex flex-col">
      {/* Legend Header */}
      <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-500 z-10">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700">Link Status:</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-emerald-500 rounded-full inline-block"></span> Active
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-amber-500 rounded-full inline-block"></span> Degraded
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-rose-500 rounded-full inline-block"></span> Failed
          </span>
        </div>
        <span className="text-slate-400">Click any node to inspect</span>
      </div>

      {/* SVG Canvas */}
      <div className="flex-1 relative overflow-auto p-4 flex items-center justify-center">
        <svg className="w-[600px] h-[360px] select-none" viewBox="0 0 600 360">
          {/* Render Connection Lines */}
          {links.map((l) => (
            <line
              key={l.id}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke={l.stroke}
              strokeWidth="2.5"
              strokeDasharray={l.isFailed ? '4,4' : 'none'}
              strokeLinecap="round"
            />
          ))}

          {/* Render Device Nodes */}
          {devices.map((dev) => {
            const pos = nodePositions[dev._id] || { x: 300, y: 180 };
            const Icon = getDeviceIcon(dev.deviceType);
            const colors = getStatusColor(dev.status);
            const isSelected = selectedDeviceId === dev._id;
            const isHovered = hoveredNode === dev._id;

            return (
              <g
                key={dev._id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => onSelectDevice && onSelectDevice(dev)}
                onMouseEnter={() => setHoveredNode(dev._id)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer transition-transform duration-150"
              >
                {/* Node Box */}
                <rect
                  x="-65"
                  y="-22"
                  width="130"
                  height="44"
                  rx="6"
                  fill="#ffffff"
                  stroke={isSelected ? '#2563eb' : (isHovered ? '#64748b' : colors.stroke)}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  filter="drop-shadow(0 1px 2px rgba(0, 0, 0, 0.05))"
                />

                {/* Status Dot */}
                <circle
                  cx="-48"
                  cy="0"
                  r="5"
                  fill={colors.stroke}
                />

                {/* Label text */}
                <text
                  x="-36"
                  y="-4"
                  fontSize="10"
                  fontWeight="600"
                  fill="#1e293b"
                  textAnchor="start"
                >
                  {dev.name.length > 15 ? dev.name.substring(0, 14) + '…' : dev.name}
                </text>

                <text
                  x="-36"
                  y="9"
                  fontSize="9"
                  fontFamily="monospace"
                  fill="#64748b"
                  textAnchor="start"
                >
                  {dev.ip}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default TopologyGraph;
