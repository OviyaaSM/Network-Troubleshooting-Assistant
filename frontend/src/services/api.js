/**
 * Frontend API Service
 * Communicates with the Express / Vercel Serverless Backend.
 */

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Diagnostics
  runDiagnostics: (payload) => request('/diagnostics/run', { method: 'POST', body: JSON.stringify(payload) }),
  getHistory: (limit = 20, offset = 0) => request(`/diagnostics/history?limit=${limit}&offset=${offset}`),
  getReportById: (id) => request(`/diagnostics/${id}`),
  getScenarios: () => request('/diagnostics/scenarios'),

  // Assistant
  sendAssistantQuery: (query, context = {}) => request('/assistant/query', { method: 'POST', body: JSON.stringify({ query, context }) }),

  // Network & Topology
  getTopology: () => request('/network/topology'),
  updateDeviceStatus: (deviceId, status) => request('/network/topology/device', { method: 'POST', body: JSON.stringify({ deviceId, status }) }),
  getNetworkStatus: () => request('/network/status'),
  checkHealth: () => request('/network/health'),

  // FLAT Engine
  getDfaSpec: () => request('/flat/dfa-spec'),
  simulateDfa: (sequence) => request('/flat/simulate-dfa', { method: 'POST', body: JSON.stringify({ sequence }) }),
  testRegex: (text) => request('/flat/match-regex', { method: 'POST', body: JSON.stringify({ text }) })
};

export default api;
