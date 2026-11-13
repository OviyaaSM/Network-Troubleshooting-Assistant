import React, { useState, useEffect } from 'react';
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  ExternalLink,
  ChevronRight,
  X
} from 'lucide-react';
import { api } from '../services/api.js';

export function DiagnosticHistory({ onSelectReport }) {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeModalReport, setActiveModalReport] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      setLoading(true);
      const res = await api.getHistory(50, 0);
      if (res.success) {
        setReports(res.reports || []);
        setTotal(res.total || 0);
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">Diagnostic Reports Archive</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Historical audit logs of previous network tests, DFA sequence traces, and rule-engine classifications.
          </p>
        </div>

        <button
          onClick={loadHistory}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Reports Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Audit Log ({total} Total Records)
          </span>
        </div>

        <div className="overflow-x-auto">
          {reports.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">
              No historical diagnostic records found. Run a test from the Network Diagnosis tab to create an entry.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-white text-[11px] text-slate-400 uppercase border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Target Address</th>
                  <th className="px-4 py-3">Tests Passed</th>
                  <th className="px-4 py-3">Tests Failed</th>
                  <th className="px-4 py-3">Identified Issue</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => {
                  const testsObj = r.tests || {};
                  const testList = Object.values(testsObj);
                  const passedCount = testList.filter(t => t.status === 'success').length;
                  const failedCount = testList.filter(t => t.status === 'failed').length;

                  return (
                    <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(r.timestamp || r.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                        {r.target}:{r.port || 80}
                        {r.isSimulated && (
                          <span className="ml-1.5 text-[9px] bg-amber-50 text-amber-700 px-1 py-0.5 rounded border border-amber-200">
                            Sim
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                          {passedCount} passed
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded text-[11px] ${
                          failedCount > 0 ? 'text-rose-600 bg-rose-50' : 'text-slate-400 bg-slate-50'
                        }`}>
                          {failedCount} failed
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 max-w-xs truncate" title={r.identifiedIssue}>
                        {r.identifiedIssue}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          r.overallStatus === 'success' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : (r.overallStatus === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')
                        }`}>
                          {r.overallStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setActiveModalReport(r)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Report Details Modal */}
      {activeModalReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Diagnostic Report: {activeModalReport.target}:{activeModalReport.port || 80}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  {new Date(activeModalReport.timestamp || activeModalReport.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setActiveModalReport(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Status and Severity */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-md border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Overall Status</span>
                  <span className="font-bold text-slate-800 uppercase">{activeModalReport.overallStatus}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Severity Level</span>
                  <span className="font-bold text-rose-600">{activeModalReport.severity || 'None'}</span>
                </div>
              </div>

              {/* Identified Problem */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Identified Issue</span>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-slate-800 font-semibold">
                  {activeModalReport.identifiedIssue}
                </div>
              </div>

              {/* Evidence */}
              {activeModalReport.evidence && activeModalReport.evidence.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Evidence</span>
                  <div className="space-y-1">
                    {activeModalReport.evidence.map((ev, idx) => (
                      <div key={idx} className="p-2 bg-white rounded border border-slate-200 text-slate-700 text-[11px]">
                        <strong>{ev.test}</strong>: {ev.detail}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Solutions */}
              {activeModalReport.recommendedSolutions && activeModalReport.recommendedSolutions.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Recommended Actions</span>
                  <ol className="space-y-1.5">
                    {activeModalReport.recommendedSolutions.map((sol, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-700">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{sol}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setActiveModalReport(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DiagnosticHistory;
