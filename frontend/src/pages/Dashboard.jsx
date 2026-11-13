import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Activity, 
  ArrowRight, 
  Server, 
  ShieldAlert, 
  Clock, 
  ExternalLink 
} from 'lucide-react';
import { api } from '../services/api.js';

export function Dashboard({ onNavigate, onViewReport }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTests: 0,
    successfulTests: 0,
    failedTests: 0,
    warningTests: 0,
    overallHealth: 'Healthy',
    localGatewayIp: '192.168.1.1',
    gatewayStatus: 'success',
    recentIssues: []
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const res = await api.getNetworkStatus();
      if (res.success) {
        setStats(res.stats);
        setRecentActivity(res.recentActivity || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  const successRate = stats.totalTests > 0 
    ? Math.round((stats.successfulTests / stats.totalTests) * 100) 
    : 100;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / System Health Summary */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            stats.overallHealth === 'Healthy' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
          }`}>
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800">System Status: {stats.overallHealth}</h2>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                stats.overallHealth === 'Healthy' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {stats.overallHealth === 'Healthy' ? 'Normal Operations' : 'Action Required'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Local Gateway ({stats.localGatewayIp}): <span className="font-semibold text-slate-700 capitalize">{stats.gatewayStatus}</span> &bull; Success Rate: <span className="font-semibold text-slate-700">{successRate}%</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => onNavigate('diagnosis')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-sm transition-all"
          >
            <span>Run New Diagnosis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tests */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Diagnostics Run</span>
            <span className="p-1.5 bg-slate-100 text-slate-600 rounded">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{stats.totalTests}</div>
          <p className="text-[11px] text-slate-400 mt-1">Lifetime diagnostic sessions</p>
        </div>

        {/* Successful */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Successful Tests</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{stats.successfulTests}</div>
          <p className="text-[11px] text-slate-400 mt-1">Full socket/DNS/HTTP reachability</p>
        </div>

        {/* Failed */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Failed Tests</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded">
              <XCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{stats.failedTests}</div>
          <p className="text-[11px] text-slate-400 mt-1">Errors captured & analyzed by DFA</p>
        </div>

        {/* Warnings / Partial */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Warnings / Latency</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{stats.warningTests}</div>
          <p className="text-[11px] text-slate-400 mt-1">Degraded latency or non-200 HTTP</p>
        </div>
      </div>

      {/* Main Grid: Recent Activity & Recent Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Diagnostic Activity Table (2 columns) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Recent Diagnostic Activity</h3>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <span>View All History</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="p-0 overflow-x-auto flex-1">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No diagnostic activity recorded yet. Run a diagnosis to see real-time log records.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Target Address</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 font-semibold">Identified Issue</th>
                    <th className="px-4 py-2.5 font-semibold">Timestamp</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentActivity.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-800">
                        {r.target}
                        {r.isSimulated && (
                          <span className="ml-1.5 text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded border border-slate-200">
                            Sim
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          r.overallStatus === 'success' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : (r.overallStatus === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200')
                        }`}>
                          {r.overallStatus === 'success' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-600" />
                          )}
                          <span className="capitalize">{r.overallStatus}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 max-w-[200px] truncate" title={r.identifiedIssue}>
                        {r.identifiedIssue}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-[11px]">
                        {new Date(r.timestamp || r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onViewReport(r._id)}
                          className="text-blue-600 hover:text-blue-800 font-semibold text-[11px]"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Network Issues & Alerts Card (1 column) */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Recent Network Issues</h3>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-medium">
              {stats.recentIssues?.length || 0} Issues
            </span>
          </div>

          <div className="p-4 flex-1 space-y-3">
            {(!stats.recentIssues || stats.recentIssues.length === 0) ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                No active network failures detected in recent tests.
              </div>
            ) : (
              stats.recentIssues.map((issue, idx) => (
                <div key={idx} className="p-3 rounded-md border border-slate-200 bg-slate-50/60 flex items-start gap-3">
                  <div className={`mt-0.5 p-1 rounded ${
                    issue.severity === 'Critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 truncate">{issue.target}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                        issue.severity === 'Critical' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{issue.issue}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(issue.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
