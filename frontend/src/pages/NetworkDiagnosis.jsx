import React, { useState, useEffect } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Server, 
  ChevronRight,
  Terminal,
  Activity
} from 'lucide-react';
import { api } from '../services/api.js';

export function NetworkDiagnosis({ isSimulated, setIsSimulated, initialReportId }) {
  const [target, setTarget] = useState('google.com');
  const [port, setPort] = useState('80');
  const [protocol, setProtocol] = useState('http');
  const [simulationScenario, setSimulationScenario] = useState('ALL_SUCCESS');
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [currentResult, setCurrentResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadScenarios();
    if (initialReportId) {
      loadSpecificReport(initialReportId);
    }
  }, [initialReportId]);

  async function loadScenarios() {
    try {
      const res = await api.getScenarios();
      if (res.success) {
        setScenarios(res.scenarios);
      }
    } catch (e) {
      console.warn('Scenarios load error:', e);
    }
  }

  async function loadSpecificReport(id) {
    try {
      setLoading(true);
      const res = await api.getReportById(id);
      if (res.success) {
        setCurrentResult(res.data);
        setTarget(res.data.target);
        setPort(res.data.port || 80);
      }
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartDiagnosis() {
    if (!target.trim()) {
      setErrorMsg('Please specify a target domain name or IPv4 address.');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    setProgress(15);
    setProgressLabel('Probing Local Default Gateway...');

    try {
      setTimeout(() => { setProgress(40); setProgressLabel('Resolving Domain Name (DNS)...'); }, 300);
      setTimeout(() => { setProgress(65); setProgressLabel('Probing Destination Reachability & TCP Port...'); }, 700);
      setTimeout(() => { setProgress(85); setProgressLabel('Executing HTTP Application & DFA Synthesizer...'); }, 1100);

      const res = await api.runDiagnostics({
        target: target.trim(),
        port: parseInt(port, 10) || 80,
        protocol,
        isSimulated,
        simulationScenario
      });

      if (res.success) {
        setProgress(100);
        setProgressLabel('Diagnosis Complete');
        setCurrentResult(res.data);
      } else {
        setErrorMsg(res.error || 'Failed to complete network diagnosis.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error executing diagnostic pipeline.');
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 400);
    }
  }

  // Predefined quick targets
  const quickTargets = [
    { label: 'Google (Public Web)', host: 'google.com', port: 80 },
    { label: 'Cloudflare DNS', host: '1.1.1.1', port: 53 },
    { label: 'Invalid Domain (DNS Failure Test)', host: 'network-fake-domain-test.invalid', port: 80 },
    { label: 'Refused Port Test', host: 'google.com', port: 8181 }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Target Input & Execution Configuration Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Target Diagnostic Configuration</h3>
            <p className="text-xs text-slate-500">Provide an IPv4 address or FQDN hostname to execute end-to-end network diagnosis.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Mode:</span>
            <button
              onClick={() => setIsSimulated(!isSimulated)}
              className={`text-xs px-2.5 py-1 rounded-md border font-semibold flex items-center gap-1.5 transition-colors ${
                isSimulated 
                  ? 'bg-amber-50 text-amber-800 border-amber-300' 
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${isSimulated ? 'text-amber-600 fill-amber-500' : 'text-slate-400'}`} />
              <span>{isSimulated ? 'Simulation Mode Active' : 'Live Network Mode'}</span>
            </button>
          </div>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target IP Address or Domain
            </label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. google.com or 93.184.216.34"
              className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              disabled={loading}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              TCP Port
            </label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="80"
              className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              disabled={loading}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Protocol
            </label>
            <select
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              disabled={loading}
            >
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <button
              onClick={handleStartDiagnosis}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 text-xs font-bold px-4 py-2 rounded-md shadow-sm transition-all ${
                loading
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Diagnosing...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Diagnosis</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Simulation Scenario Picker (if simulation mode active) */}
        {isSimulated && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-md p-3 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-800 font-medium">
              <Zap className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Simulate Controlled Failure Condition:</span>
            </div>
            <select
              value={simulationScenario}
              onChange={(e) => setSimulationScenario(e.target.value)}
              className="bg-white border border-amber-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {scenarios.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name} (DFA: {sc.sequence})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quick Target Chips */}
        <div className="flex items-center flex-wrap gap-2 pt-1 text-xs text-slate-500">
          <span className="font-semibold text-slate-400">Quick Test Targets:</span>
          {quickTargets.map((qt, idx) => (
            <button
              key={idx}
              onClick={() => { setTarget(qt.host); setPort(qt.port); }}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono border border-slate-200 transition-colors"
            >
              {qt.label}
            </button>
          ))}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Loading Progress Bar */}
        {loading && (
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>{progressLabel}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Main Results View */}
      {currentResult && (
        <div className="space-y-6">
          {/* Test Table Component (NetBrain style) */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Diagnostic Probe Matrix ({currentResult.target}:{currentResult.port})
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-mono">
                  DFA Sequence: <strong className="text-blue-600">{currentResult.analysis?.dfaClassification?.inputSequence || 'GDST'}</strong>
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  currentResult.overallStatus === 'success' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : (currentResult.overallStatus === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')
                }`}>
                  {currentResult.overallStatus.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-white text-[11px] text-slate-400 uppercase border-b border-slate-100 font-semibold">
                  <tr>
                    <th className="px-5 py-3 w-48">Test Name</th>
                    <th className="px-5 py-3 w-28">Status</th>
                    <th className="px-5 py-3 w-24">Latency</th>
                    <th className="px-5 py-3">Technical Output & Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Gateway */}
                  {currentResult.tests?.gateway && (
                    <tr className="hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-semibold text-slate-800 flex items-center gap-2">
                        <span>Gateway Connectivity</span>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={currentResult.tests.gateway.status} />
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-500">
                        {currentResult.tests.gateway.latencyMs ? `${currentResult.tests.gateway.latencyMs}ms` : '—'}
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-slate-600">
                        {currentResult.tests.gateway.details || currentResult.tests.gateway.error}
                      </td>
                    </tr>
                  )}

                  {/* DNS */}
                  {currentResult.tests?.dns && (
                    <tr className="hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-semibold text-slate-800">
                        DNS Resolution
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={currentResult.tests.dns.status} />
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-500">
                        {currentResult.tests.dns.latencyMs ? `${currentResult.tests.dns.latencyMs}ms` : '—'}
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-slate-600">
                        {currentResult.tests.dns.details || currentResult.tests.dns.error}
                      </td>
                    </tr>
                  )}

                  {/* Reachability */}
                  {currentResult.tests?.reachability && (
                    <tr className="hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-semibold text-slate-800">
                        Destination Reachability
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={currentResult.tests.reachability.status} />
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-500">
                        {currentResult.tests.reachability.latencyMs ? `${currentResult.tests.reachability.latencyMs}ms` : '—'}
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-slate-600">
                        {currentResult.tests.reachability.details || currentResult.tests.reachability.error}
                      </td>
                    </tr>
                  )}

                  {/* TCP */}
                  {currentResult.tests?.tcp && (
                    <tr className="hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-semibold text-slate-800">
                        TCP Port ({currentResult.port}) Handshake
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={currentResult.tests.tcp.status} />
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-500">
                        {currentResult.tests.tcp.latencyMs ? `${currentResult.tests.tcp.latencyMs}ms` : '—'}
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-slate-600">
                        {currentResult.tests.tcp.details || currentResult.tests.tcp.error}
                      </td>
                    </tr>
                  )}

                  {/* HTTP */}
                  {currentResult.tests?.http && (
                    <tr className="hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-semibold text-slate-800">
                        HTTP/HTTPS Connectivity
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={currentResult.tests.http.status} />
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-500">
                        {currentResult.tests.http.latencyMs ? `${currentResult.tests.http.latencyMs}ms` : '—'}
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-slate-600">
                        {currentResult.tests.http.details || currentResult.tests.http.error}
                      </td>
                    </tr>
                  )}

                  {/* Route Analysis (Traceroute) */}
                  {currentResult.tests?.traceroute && (
                    <tr className="hover:bg-slate-50/60 bg-slate-50/30">
                      <td className="px-5 py-3 font-semibold text-slate-800">
                        Route Analysis / Traceroute
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={currentResult.tests.traceroute.status} />
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-400">
                        N/A
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-slate-500">
                        {currentResult.tests.traceroute.details || currentResult.tests.traceroute.reason}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Troubleshooting Synthesis & Solutions Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Identified Problem & Evidence (2 columns) */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    currentResult.analysis?.severity === 'None' ? 'bg-emerald-500' : (currentResult.analysis?.severity === 'Critical' ? 'bg-rose-500' : 'bg-amber-500')
                  }`}></span>
                  <h3 className="text-sm font-bold text-slate-800">
                    Troubleshooting Analysis: {currentResult.analysis?.problem}
                  </h3>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  currentResult.analysis?.severity === 'None' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  Severity: {currentResult.analysis?.severity || 'Low'}
                </span>
              </div>

              {/* Possible Cause */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Suspected Root Cause
                </span>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-200">
                  {currentResult.analysis?.possibleCause}
                </p>
              </div>

              {/* Empirical Evidence */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Empirical Diagnostic Evidence
                </span>
                <ul className="space-y-1.5">
                  {currentResult.analysis?.evidence?.map((ev, idx) => (
                    <li key={idx} className="text-xs flex items-start gap-2 text-slate-600 font-mono bg-white p-2 rounded border border-slate-100">
                      <ChevronRight className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span><strong>{ev.test}</strong>: {ev.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Solutions */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Recommended Remediation Steps
                </span>
                <ol className="space-y-2">
                  {currentResult.analysis?.recommendations?.map((rec, idx) => (
                    <li key={idx} className="text-xs flex items-start gap-2.5 text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px] border border-blue-200">
                        {idx + 1}
                      </span>
                      <span className="pt-0.5 leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Verification Steps */}
              {currentResult.analysis?.verificationSteps?.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Suggested Verification Steps
                  </span>
                  <div className="space-y-1">
                    {currentResult.analysis.verificationSteps.map((v, idx) => (
                      <div key={idx} className="text-xs text-slate-600 flex items-center gap-2 font-mono">
                        <Terminal className="w-3.5 h-3.5 text-slate-400" />
                        <span>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* FLAT & DFA Engine Evaluation Sidebar (1 column) */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                  Academic Integration
                </span>
                <h4 className="text-xs font-bold text-slate-800">FLAT Automaton & Regex Classification</h4>
              </div>

              {/* DFA Output */}
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3 space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                  Deterministic Finite Automaton
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Final State:</span>
                  <span className="font-mono font-bold text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                    {currentResult.analysis?.dfaClassification?.finalState || 'q0'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 font-medium">
                  {currentResult.analysis?.dfaClassification?.finalStateLabel}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Input Sequence: &quot;{currentResult.analysis?.dfaClassification?.inputSequence}&quot;
                </div>
              </div>

              {/* Regex Matcher Output */}
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3 space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                  Regex Error Pattern Matching
                </span>
                <div className="text-xs font-mono font-semibold text-slate-800">
                  {currentResult.analysis?.regexClassification?.code || 'NO_ERROR'}
                </div>
                <div className="text-[11px] text-slate-600">
                  {currentResult.analysis?.regexClassification?.category}
                </div>
                {currentResult.analysis?.regexClassification?.matchedToken && (
                  <div className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 p-1.5 rounded font-mono truncate">
                    Matched: &quot;{currentResult.analysis.regexClassification.matchedToken}&quot;
                  </div>
                )}
              </div>

              <div className="pt-2 text-[11px] text-slate-500">
                <p>
                  The diagnosis is formally verified through language recognition <code className="text-blue-600 font-mono">w &isin; L(M)</code> in the network state machine.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === 'success') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Success</span>
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
        <XCircle className="w-3.5 h-3.5 text-rose-600" />
        <span>Failed</span>
      </span>
    );
  }
  if (status === 'warning') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        <span>Warning</span>
      </span>
    );
  }
  if (status === 'unsupported') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
        <span>Unsupported</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
      <span>Pending</span>
    </span>
  );
}

export default NetworkDiagnosis;
