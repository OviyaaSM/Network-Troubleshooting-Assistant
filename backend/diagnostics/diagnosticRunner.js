/**
 * Diagnostic Pipeline Runner
 * 
 * Orchestrates individual diagnostic tests:
 * 1. Gateway Connectivity Check
 * 2. DNS Resolution Test
 * 3. Destination Reachability (Ping / TCP-probe)
 * 4. TCP Port Connectivity Test
 * 5. HTTP/HTTPS Application Check
 * 6. Traceroute / Route Analysis (with capability detection)
 * 
 * Feeds structured test outputs into TroubleshootingEngine to produce FLAT DFA & Regex analysis.
 */

import { checkGateway } from './gatewayCheck.js';
import { checkDNS } from './dnsCheck.js';
import { checkReachability } from './pingCheck.js';
import { checkTCP } from './tcpCheck.js';
import { checkHTTP } from './httpCheck.js';
import { checkTraceroute } from './tracerouteCheck.js';
import { getSimulationScenario } from './simulator.js';
import { TroubleshootingEngine } from '../flat-engine/troubleshootingEngine.js';

export async function runDiagnostics({
  target = 'google.com',
  port = 80,
  protocol = 'http',
  isSimulated = false,
  simulationScenario = 'ALL_SUCCESS'
}) {
  const cleanTarget = target.trim();
  const targetPort = parseInt(port, 10) || 80;

  // 1. Simulation Mode Execution
  if (isSimulated) {
    const scenario = getSimulationScenario(simulationScenario);
    const analysis = TroubleshootingEngine.analyze({
      target: cleanTarget,
      port: targetPort,
      testResults: scenario.results,
      isSimulated: true
    });

    return {
      target: cleanTarget,
      port: targetPort,
      isSimulated: true,
      simulationScenario,
      timestamp: new Date().toISOString(),
      tests: scenario.results,
      analysis,
      overallStatus: scenario.sequence === 'GDST' ? 'success' : 'failed'
    };
  }

  // 2. Real Execution Pipeline
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(cleanTarget);
  const tests = {};

  // Step 1: Check Local Gateway
  try {
    tests.gateway = await checkGateway();
  } catch (err) {
    tests.gateway = {
      name: 'Gateway Connectivity',
      status: 'failed',
      error: err.message
    };
  }

  // Step 2: DNS Resolution
  try {
    tests.dns = await checkDNS(cleanTarget);
  } catch (err) {
    tests.dns = {
      name: 'DNS Resolution',
      status: 'failed',
      error: err.message
    };
  }

  // Determine IP to probe
  const resolvedIp = tests.dns?.addresses?.[0] || (isIp ? cleanTarget : null);

  // Step 3: Destination Reachability
  if (resolvedIp) {
    try {
      tests.reachability = await checkReachability(resolvedIp, { port: targetPort });
    } catch (err) {
      tests.reachability = {
        name: 'Destination Reachability',
        status: 'failed',
        error: err.message
      };
    }
  } else {
    tests.reachability = {
      name: 'Destination Reachability',
      status: 'failed',
      error: 'Cannot probe destination without resolved IP address.',
      details: 'Skipped due to DNS failure.'
    };
  }

  // Step 4: TCP Port Connectivity
  if (resolvedIp) {
    try {
      tests.tcp = await checkTCP(resolvedIp, targetPort);
    } catch (err) {
      tests.tcp = {
        name: 'TCP Port Connectivity',
        status: 'failed',
        port: targetPort,
        error: err.message
      };
    }
  } else {
    tests.tcp = {
      name: 'TCP Port Connectivity',
      status: 'failed',
      port: targetPort,
      error: 'DNS resolution failed; no IP to connect.'
    };
  }

  // Step 5: HTTP / HTTPS Application Layer Check
  if (resolvedIp) {
    try {
      tests.http = await checkHTTP(cleanTarget, { port: targetPort, protocol });
    } catch (err) {
      tests.http = {
        name: 'HTTP/HTTPS Connectivity',
        status: 'failed',
        error: err.message
      };
    }
  } else {
    tests.http = {
      name: 'HTTP/HTTPS Connectivity',
      status: 'failed',
      error: 'HTTP request could not be sent (Host could not be resolved).'
    };
  }

  // Step 6: Route Analysis (Traceroute)
  try {
    tests.traceroute = await checkTraceroute(cleanTarget);
  } catch (err) {
    tests.traceroute = {
      name: 'Route Analysis / Traceroute',
      status: 'unsupported',
      supported: false,
      error: err.message
    };
  }

  // Step 7: Analyze with Troubleshooting Engine
  const analysis = TroubleshootingEngine.analyze({
    target: cleanTarget,
    port: targetPort,
    testResults: tests,
    isSimulated: false
  });

  const failedTestsCount = Object.values(tests).filter(t => t.status === 'failed').length;
  const overallStatus = failedTestsCount === 0 ? 'success' : (failedTestsCount === 1 ? 'warning' : 'failed');

  return {
    target: cleanTarget,
    port: targetPort,
    isSimulated: false,
    timestamp: new Date().toISOString(),
    tests,
    analysis,
    overallStatus
  };
}

export default runDiagnostics;
