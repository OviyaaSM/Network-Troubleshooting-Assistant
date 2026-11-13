import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('Backend API Endpoints', () => {
  it('GET /api/health returns 200 and healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('GET /api/flat/dfa-spec returns formal 5-tuple specification', async () => {
    const res = await request(app).get('/api/flat/dfa-spec');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.specification.alphabet).toBeDefined();
    expect(res.body.specification.states).toBeDefined();
    expect(res.body.specification.transitionMatrix.length).toBeGreaterThan(0);
  });

  it('POST /api/flat/simulate-dfa traces state machine execution', async () => {
    const res = await request(app)
      .post('/api/flat/simulate-dfa')
      .send({ sequence: 'GDST' });
    
    expect(res.status).toBe(200);
    expect(res.body.result.finalState).toBe('q_GDST');
    expect(res.body.result.isAccepted).toBe(true);
    expect(res.body.result.trace.length).toBe(4);
  });

  it('POST /api/flat/match-regex classifies error string', async () => {
    const res = await request(app)
      .post('/api/flat/match-regex')
      .send({ text: 'connect ETIMEDOUT 10.0.0.1:80' });
    
    expect(res.status).toBe(200);
    expect(res.body.classification.code).toBe('CONNECTION_TIMEOUT');
    expect(res.body.classification.severity).toBe('Medium');
  });

  it('POST /api/diagnostics/run with simulation returns full diagnostic report', async () => {
    const res = await request(app)
      .post('/api/diagnostics/run')
      .send({
        target: 'demo.test',
        isSimulated: true,
        simulationScenario: 'DNS_FAILURE'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.analysis.problem).toBe('DNS Name Resolution Failure');
    expect(res.body.data.tests.dns.status).toBe('failed');
  });

  it('GET /api/diagnostics/history returns reports list', async () => {
    const res = await request(app).get('/api/diagnostics/history');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.reports)).toBe(true);
  });

  it('GET /api/network/topology returns device list', async () => {
    const res = await request(app).get('/api/network/topology');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.devices.length).toBeGreaterThanOrEqual(5);
  });

  it('POST /api/assistant/query handles network assistant questions', async () => {
    const res = await request(app)
      .post('/api/assistant/query')
      .send({ query: 'Explain why my test failed' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reply).toBeDefined();
  });
});
