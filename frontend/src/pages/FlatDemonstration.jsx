import React, { useState, useEffect } from 'react';
import { 
  Binary, 
  Code2, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Table, 
  Layers, 
  ShieldCheck, 
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api.js';

export function FlatDemonstration() {
  // DFA Simulation State
  const [sequenceInput, setSequenceInput] = useState('GDST');
  const [dfaResult, setDfaResult] = useState(null);
  const [dfaSpec, setDfaSpec] = useState(null);
  const [dfaLoading, setDfaLoading] = useState(false);

  // Regex Testing State
  const [regexInput, setRegexInput] = useState('getaddrinfo ENOTFOUND example.invalid');
  const [regexResult, setRegexResult] = useState(null);
  const [availablePatterns, setAvailablePatterns] = useState([]);
  const [regexLoading, setRegexLoading] = useState(false);

  useEffect(() => {
    loadDfaSpec();
    handleTestRegex(regexInput);
    handleSimulateDfa(sequenceInput);
  }, []);

  async function loadDfaSpec() {
    try {
      const res = await api.getDfaSpec();
      if (res.success) {
        setDfaSpec(res.specification);
      }
    } catch (e) {
      console.warn('DFA Spec load error:', e);
    }
  }

  async function handleSimulateDfa(seq) {
    const input = seq !== undefined ? seq : sequenceInput;
    if (!input) return;
    setDfaLoading(true);
    try {
      const res = await api.simulateDfa(input);
      if (res.success) {
        setDfaResult(res.result);
      }
    } catch (e) {
      console.error('DFA simulation error:', e);
    } finally {
      setDfaLoading(false);
    }
  }

  async function handleTestRegex(text) {
    const input = text !== undefined ? text : regexInput;
    setRegexLoading(true);
    try {
      const res = await api.testRegex(input);
      if (res.success) {
        setRegexResult(res.classification);
        if (res.availablePatterns) {
          setAvailablePatterns(res.availablePatterns);
        }
      }
    } catch (e) {
      console.error('Regex test error:', e);
    } finally {
      setRegexLoading(false);
    }
  }

  const sampleSequences = [
    { label: 'All Passed', seq: 'GDST', desc: 'Gateway, DNS, Server, and TCP succeed' },
    { label: 'Gateway Offline', seq: 'g', desc: 'Local gateway connection failure' },
    { label: 'DNS Failed', seq: 'Gd', desc: 'Gateway succeeds, DNS lookup fails' },
    { label: 'Server Down', seq: 'GDs', desc: 'Gateway and DNS succeed, Server unreachable' },
    { label: 'Port Filtered', seq: 'GDSt', desc: 'Server alive, but TCP port closed/blocked' },
    { label: 'With Whitespace', seq: 'G D S T', desc: 'Normalized to GDST' }
  ];

  const sampleErrors = [
    'getaddrinfo ENOTFOUND api.service.internal',
    'connect ETIMEDOUT 198.51.100.1:443',
    'connect ECONNREFUSED 127.0.0.1:8080',
    'EHOSTUNREACH: No route to host',
    'CERT_HAS_EXPIRED: certificate has expired',
    'HTTP 502 Bad Gateway: Upstream server dropped socket'
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold">
            <Binary className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Formal Languages & Automata Theory (FLAT) Engine
            </h2>
            <p className="text-xs text-slate-500">
              Demonstrating Regular Grammars (Type-3) for unstructured log classification and Deterministic Finite Automata (DFA) for multi-stage network diagnosis.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: DFA State Machine Simulator */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Part 1: Deterministic Finite Automaton (DFA) Simulator
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
            M = (Q, &Sigma;, &delta;, q0, F)
          </span>
        </div>

        <div className="p-5 space-y-5">
          {/* Alphabet Guide */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-md p-3.5 text-xs">
            <span className="font-bold text-blue-900 block mb-1">
              Input Alphabet &Sigma; = {'{'} G, g, D, d, S, s, T, t {'}'}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-blue-800 font-mono mt-2">
              <div><strong className="text-emerald-700">G:</strong> Gateway reachable</div>
              <div><strong className="text-rose-700">g:</strong> Gateway unreachable</div>
              <div><strong className="text-emerald-700">D:</strong> DNS resolved</div>
              <div><strong className="text-rose-700">d:</strong> DNS failed</div>
              <div><strong className="text-emerald-700">S:</strong> Server reachable</div>
              <div><strong className="text-rose-700">s:</strong> Server unreachable</div>
              <div><strong className="text-emerald-700">T:</strong> TCP port open</div>
              <div><strong className="text-rose-700">t:</strong> TCP port closed</div>
            </div>
          </div>

          {/* Interactive Simulation Controls */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-8">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enter Diagnostic Sequence w &isin; &Sigma;*
              </label>
              <input
                type="text"
                value={sequenceInput}
                onChange={(e) => setSequenceInput(e.target.value)}
                placeholder="e.g. GDST, Gd, g, GDSt"
                className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-4">
              <button
                onClick={() => handleSimulateDfa()}
                disabled={dfaLoading}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold shadow-sm transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Simulate Transitions</span>
              </button>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-400 font-semibold text-[11px]">Test Sequences:</span>
            {sampleSequences.map((s, idx) => (
              <button
                key={idx}
                onClick={() => { setSequenceInput(s.seq); handleSimulateDfa(s.seq); }}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] border border-slate-200 transition-colors"
                title={s.desc}
              >
                {s.label} ({s.seq})
              </button>
            ))}
          </div>

          {/* DFA Trace and Result Output */}
          {dfaResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Step-by-step Trace */}
              <div className="border border-slate-200 rounded-md p-4 bg-slate-50/50 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  State Transition Trace (&delta;)
                </span>

                <div className="space-y-1.5 font-mono text-xs">
                  <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500">Step 0 (Initial)</span>
                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">q0</span>
                  </div>

                  {dfaResult.trace.map((tr) => (
                    <div key={tr.step} className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Step {tr.step}:</span>
                        <span className="px-1.5 py-0.5 bg-slate-100 font-bold rounded text-slate-800">
                          &delta;({tr.fromState}, {tr.symbol})
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className={`px-1.5 py-0.5 rounded font-bold ${
                          tr.isAccepting ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {tr.toState}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-sans">{tr.symbolMeaning}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final State & Diagnostic Category */}
              <div className="border border-slate-200 rounded-md p-4 bg-white space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                    Automaton Acceptance & Diagnosis
                  </span>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200 mb-3">
                    <span className="text-xs text-slate-600">Final Terminal State:</span>
                    <span className={`font-mono font-bold text-sm px-2.5 py-0.5 rounded ${
                      dfaResult.isAccepted ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {dfaResult.finalState}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-slate-800 text-sm">
                      {dfaResult.outcome?.category || 'Syntax Error'}
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      {dfaResult.outcome?.summary}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Root Cause Recommendation:</span> {dfaResult.outcome?.recommendation}
                </div>
              </div>
            </div>
          )}

          {/* Formal DFA Transition Table */}
          {dfaSpec && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Formal State Transition Matrix &delta;(State, Symbol)
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 text-[11px]">
                    <tr>
                      <th className="p-2.5 border-b border-r border-slate-200">State (q)</th>
                      <th className="p-2 border-b border-r border-slate-200 text-center">G</th>
                      <th className="p-2 border-b border-r border-slate-200 text-center">g</th>
                      <th className="p-2 border-b border-r border-slate-200 text-center">D</th>
                      <th className="p-2 border-b border-r border-slate-200 text-center">d</th>
                      <th className="p-2 border-b border-r border-slate-200 text-center">S</th>
                      <th className="p-2 border-b border-r border-slate-200 text-center">s</th>
                      <th className="p-2 border-b border-r border-slate-200 text-center">T</th>
                      <th className="p-2 border-b border-slate-200 text-center">t</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {dfaSpec.transitionMatrix?.map((row) => (
                      <tr key={row.state} className="hover:bg-slate-50">
                        <td className="p-2 border-r border-slate-200 font-bold text-slate-800">
                          {row.state} {row.isAccepting && <span className="text-emerald-600 text-[9px]">(Accept)</span>}
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center">{row.transitions.G}</td>
                        <td className="p-2 border-r border-slate-200 text-center">{row.transitions.g}</td>
                        <td className="p-2 border-r border-slate-200 text-center">{row.transitions.D}</td>
                        <td className="p-2 border-r border-slate-200 text-center">{row.transitions.d}</td>
                        <td className="p-2 border-r border-slate-200 text-center">{row.transitions.S}</td>
                        <td className="p-2 border-r border-slate-200 text-center">{row.transitions.s}</td>
                        <td className="p-2 border-r border-slate-200 text-center">{row.transitions.T}</td>
                        <td className="p-2 border-slate-200 text-center">{row.transitions.t}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Regular Expression Error Pattern Matcher */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Part 2: Regular Expression Error Classifier (Type-3 Grammar)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
            errorPatternMatcher.js
          </span>
        </div>

        <div className="p-5 space-y-5">
          {/* Input string */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-9">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enter Raw Network Error Message or Syslog Text
              </label>
              <input
                type="text"
                value={regexInput}
                onChange={(e) => setRegexInput(e.target.value)}
                placeholder="e.g. connect ETIMEDOUT 192.168.1.1:80"
                className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <button
                onClick={() => handleTestRegex()}
                disabled={regexLoading}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold shadow-sm transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Test Pattern Match</span>
              </button>
            </div>
          </div>

          {/* Quick Error Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold text-[11px]">Sample Syslog / Socket Errors:</span>
            {sampleErrors.map((errText, idx) => (
              <button
                key={idx}
                onClick={() => { setRegexInput(errText); handleTestRegex(errText); }}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] border border-slate-200 truncate max-w-[240px]"
              >
                {errText}
              </button>
            ))}
          </div>

          {/* Classification Output Card */}
          {regexResult && (
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">Formal Error Token:</span>
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    {regexResult.code}
                  </span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  regexResult.severity === 'Critical' ? 'bg-rose-100 text-rose-800' : (regexResult.severity === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700')
                }`}>
                  Severity: {regexResult.severity} &bull; Confidence: {Math.round((regexResult.confidence || 0.9) * 100)}%
                </span>
              </div>

              {regexResult.matchedToken && (
                <div className="text-xs font-mono text-slate-600 bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-slate-400">Matched Substring: </span>
                  <strong className="text-rose-600 bg-rose-50 px-1 py-0.5 rounded">&quot;{regexResult.matchedToken}&quot;</strong>
                  {regexResult.regexPattern && (
                    <span className="text-slate-400 block mt-1 text-[11px]">
                      Rule Regex: <code className="text-slate-700">{regexResult.regexPattern}</code>
                    </span>
                  )}
                </div>
              )}

              <p className="text-xs text-slate-600">
                {regexResult.explanation}
              </p>
            </div>
          )}

          {/* Compiled Regex Patterns Table */}
          {availablePatterns.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Compiled Pattern Repository (Formal Regular Expressions)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border border-slate-200">
                  <thead className="bg-slate-100 text-[11px] text-slate-700">
                    <tr>
                      <th className="p-2 border-b border-r border-slate-200">Error Code</th>
                      <th className="p-2 border-b border-r border-slate-200">Category</th>
                      <th className="p-2 border-b border-slate-200">Regular Expression Signature</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {availablePatterns.map((pat) => (
                      <tr key={pat.code} className="hover:bg-slate-50">
                        <td className="p-2 border-r border-slate-200 font-bold text-slate-800">{pat.code}</td>
                        <td className="p-2 border-r border-slate-200 font-sans text-slate-600">{pat.category}</td>
                        <td className="p-2 text-blue-700 overflow-x-auto max-w-md truncate">{pat.pattern}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FlatDemonstration;
