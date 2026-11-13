/**
 * Troubleshooting Recommendation Engine
 * 
 * Synthesizes:
 * 1. Low-level Network Diagnostic Test Metrics (Gateway, DNS, TCP, HTTP, Routing)
 * 2. Regular Expression Error Pattern Classifications (errorPatternMatcher.js)
 * 3. Formal DFA State Machine Classification (networkDFA.js)
 * 4. Expert Network Engineering Rule Base
 */

import { classifyNetworkError } from './errorPatternMatcher.js';
import { runDFA, buildDfaSequenceFromTests } from './networkDFA.js';

export class TroubleshootingEngine {
  /**
   * Evaluates all diagnostic inputs and returns an evidence-backed diagnostic report.
   * 
   * @param {Object} params
   * @param {string} params.target - Hostname or IP address
   * @param {number} [params.port=80] - Target TCP port
   * @param {Object} params.testResults - Map of test outputs (gateway, dns, tcp, http, traceroute)
   * @param {string} [params.rawError] - Any uncaught error string from socket/system
   * @param {boolean} [params.isSimulated=false] - Whether this was generated in simulation mode
   * @returns {Object} Comprehensive troubleshooting analysis
   */
  static analyze({ target, port = 80, testResults, rawError = null, isSimulated = false }) {
    // 1. Regular expression error classification
    let regexError = null;
    if (rawError) {
      regexError = classifyNetworkError(rawError);
    } else {
      // Find first failed test with an error message
      for (const [testName, result] of Object.entries(testResults)) {
        if (result && result.status === 'failed' && result.error) {
          regexError = classifyNetworkError(result.error);
          break;
        }
      }
    }

    if (!regexError) {
      regexError = classifyNetworkError(null);
    }

    // 2. Generate and run DFA
    const targetIsIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(target);
    const dfaSeq = buildDfaSequenceFromTests({
      gateway: testResults.gateway?.status === 'success' ? true : (testResults.gateway?.status === 'failed' ? false : null),
      dns: testResults.dns?.status === 'success' ? true : (testResults.dns?.status === 'failed' ? false : null),
      host: testResults.reachability?.status === 'success' ? true : (testResults.reachability?.status === 'failed' ? false : null),
      tcp: testResults.tcp?.status === 'success' ? true : (testResults.tcp?.status === 'failed' ? false : null),
      targetIsIp
    });

    const dfaEvaluation = runDFA(dfaSeq);

    // 3. Collect empirical evidence
    const evidence = [];
    if (testResults.gateway) {
      evidence.push({
        test: 'Gateway Connectivity',
        status: testResults.gateway.status,
        detail: testResults.gateway.status === 'success'
          ? `Local gateway (${testResults.gateway.gatewayIp || 'Default'}) is reachable.`
          : `Default gateway is unreachable. Error: ${testResults.gateway.error || 'No response'}`
      });
    }

    if (testResults.dns) {
      evidence.push({
        test: 'DNS Resolution',
        status: testResults.dns.status,
        detail: testResults.dns.status === 'success'
          ? `Resolved ${target} to ${testResults.dns.addresses?.join(', ') || 'valid IP'} in ${testResults.dns.latencyMs || 0}ms.`
          : `DNS lookup failed: ${testResults.dns.error || 'NXDOMAIN'}`
      });
    }

    if (testResults.tcp) {
      evidence.push({
        test: `TCP Port ${port} Handshake`,
        status: testResults.tcp.status,
        detail: testResults.tcp.status === 'success'
          ? `Successfully established TCP 3-way handshake to ${target}:${port} in ${testResults.tcp.latencyMs || 0}ms.`
          : `TCP connection failed on port ${port}: ${testResults.tcp.error || 'Connection timed out'}`
      });
    }

    if (testResults.http) {
      evidence.push({
        test: 'HTTP/HTTPS Application Check',
        status: testResults.http.status,
        detail: testResults.http.status === 'success'
          ? `HTTP GET ${testResults.http.url || target} returned status code ${testResults.http.statusCode} (${testResults.http.latencyMs || 0}ms).`
          : `HTTP request failed: ${testResults.http.error || 'Connection error'}`
      });
    }

    if (testResults.reachability) {
      evidence.push({
        test: 'Destination Reachability',
        status: testResults.reachability.status,
        detail: testResults.reachability.status === 'success'
          ? `Host responded to ICMP/UDP/TCP echo probe in ${testResults.reachability.latencyMs || 0}ms.`
          : `Host echo probe failed: ${testResults.reachability.error || 'Host unreachable'}`
      });
    }

    // 4. Synthesize root cause and solutions based on rule matrix
    let problem = 'All Systems Operational';
    let severity = 'None';
    let possibleCause = 'All network layers functioning as expected.';
    let recommendations = [
      'Network layer is operating normally.',
      'If higher-level application issues persist, check API credentials, application server logs, or payload serialization.'
    ];
    let verificationSteps = [
      'Periodically monitor network latency and packet loss.',
      'Check SSL/TLS certificate expiry.'
    ];

    if (testResults.gateway && testResults.gateway.status === 'failed') {
      problem = 'Local Default Gateway Unreachable';
      severity = 'Critical';
      possibleCause = 'Local physical interface is down, Ethernet cable disconnected, Wi-Fi association lost, or local router power failure.';
      recommendations = [
        'Inspect the physical Ethernet cable connection or reconnect to the Wi-Fi Access Point.',
        'Verify your local IP address and gateway settings (run `ipconfig` on Windows or `ip route` on Linux).',
        'Restart or power-cycle the local router/modem.',
        'Check if other local devices on the subnet can communicate with the gateway.'
      ];
      verificationSteps = [
        'Ping local gateway IP address directly (e.g., ping 192.168.1.1).',
        'Verify adapter link lights and link status in OS settings.'
      ];
    } else if (testResults.dns && testResults.dns.status === 'failed') {
      problem = 'DNS Name Resolution Failure';
      severity = 'High';
      possibleCause = `Domain name '${target}' could not be resolved. Causes include typo in hostname, local DNS cache corruption, or unresponsive upstream DNS server.`;
      recommendations = [
        `Verify hostname '${target}' spelling and domain registration status.`,
        'Flush your local DNS resolver cache (`ipconfig /flushdns` on Windows or `resolvectl flush-caches` on Linux).',
        'Test using trusted public DNS resolvers (Google DNS: 8.8.8.8, Cloudflare: 1.1.1.1).',
        'Check DNS server firewall rules to ensure UDP port 53 is not filtered.'
      ];
      verificationSteps = [
        `Perform explicit DNS query: nslookup ${target} 8.8.8.8`,
        'Check if resolving other common domains (e.g. google.com) succeeds.'
      ];
    } else if (testResults.reachability && testResults.reachability.status === 'failed' && testResults.tcp?.status === 'failed') {
      problem = 'Destination Host Unreachable / Routing Failure';
      severity = 'High';
      possibleCause = 'Target server is powered off, upstream ISP routing loop exists, or border router is dropping traffic.';
      recommendations = [
        'Perform a route trace (traceroute / tracert) to isolate the failing hop in the transit path.',
        'Check upstream ISP network health and BGP route announcements.',
        'Confirm destination host has not experienced an outage or hardware crash.'
      ];
      verificationSteps = [
        'Execute `traceroute ' + target + '` to pinpoint the drop point.',
        'Contact destination server administrator or hosting provider.'
      ];
    } else if (testResults.tcp && testResults.tcp.status === 'failed') {
      problem = `TCP Port ${port} Connection Refused or Timed Out`;
      severity = 'Medium';
      possibleCause = `The host is reachable, but TCP handshake to port ${port} failed. Either the target application daemon is stopped, listening on a different interface, or a stateful firewall (iptables, Windows Defender, AWS Security Group) is dropping/rejecting packets.`;
      recommendations = [
        `Verify whether the target service daemon is active and bound to port ${port}.`,
        'Check server-side and intermediate firewall rules (e.g., allow inbound traffic on TCP port ' + port + ').',
        'Ensure Cloud Security Groups / Network ACLs allow traffic from your source IP.',
        'Test connection with alternative diagnostic tools like telnet or netcat (`nc -zv ' + target + ' ' + port + '`).'
      ];
      verificationSteps = [
        `Run netstat / ss on the target server: ss -tulpn | grep :${port}`,
        `Test from an alternative network connection to isolate local network egress restrictions.`
      ];
    } else if (testResults.http && testResults.http.status === 'failed') {
      problem = 'HTTP Application Layer Failure';
      severity = 'Medium';
      possibleCause = testResults.http.error || 'HTTP status indicates client or server error (4xx/5xx).';
      recommendations = [
        'Inspect web server and reverse proxy error logs (Nginx, Apache, Caddy).',
        'Check SSL/TLS certificate validity and cipher suite compatibility.',
        'Verify URL path and request headers.'
      ];
      verificationSteps = [
        `Test with verbose curl: curl -Iv https://${target}`,
        'Review application health endpoint.'
      ];
    }

    return {
      target,
      port,
      problem,
      severity,
      possibleCause,
      recommendations,
      verificationSteps,
      evidence,
      regexClassification: regexError,
      dfaClassification: dfaEvaluation,
      isSimulated,
      timestamp: new Date().toISOString()
    };
  }
}

export default TroubleshootingEngine;
