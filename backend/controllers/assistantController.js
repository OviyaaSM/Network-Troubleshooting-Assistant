/**
 * Troubleshooting Assistant Controller
 * 
 * Implements an intelligent network assistant that uses:
 * - Natural Language Intent Parsing & Entity Extraction (Hostnames, IPs, Ports, Error strings)
 * - Actual Diagnostic Runner Execution
 * - Troubleshooting Recommendation Engine Knowledge Base
 * - Topology Device Status Inspection
 */

import { runDiagnostics } from '../diagnostics/diagnosticRunner.js';
import { DiagnosticReportRepository } from '../models/DiagnosticReport.js';
import { NetworkDeviceRepository } from '../models/NetworkDevice.js';
import { classifyNetworkError } from '../flat-engine/errorPatternMatcher.js';
import { runDFA } from '../flat-engine/networkDFA.js';

export async function processAssistantQuery(req, res) {
  try {
    const { query = '', context = {} } = req.body;
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      return res.status(400).json({
        success: false,
        error: 'Query text cannot be empty.'
      });
    }

    const lowerQuery = cleanQuery.toLowerCase();

    // 1. Extract potential target domain or IP from query
    const domainMatch = cleanQuery.match(/(?:to|for|at|target|ping|check|test)\s+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|(?:\d{1,3}\.){3}\d{1,3})/i);
    const bareHostMatch = cleanQuery.match(/\b([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|(?:\d{1,3}\.){3}\d{1,3})\b/);
    const targetHost = domainMatch ? domainMatch[1] : (bareHostMatch ? bareHostMatch[1] : null);

    // 2. Extract port if specified
    const portMatch = cleanQuery.match(/(?:port|:)\s*(\d{1,5})/i);
    const targetPort = portMatch ? parseInt(portMatch[1], 10) : 80;

    // INTENT A: Execute Diagnostic Check (e.g. "Check connectivity to google.com", "Test my network")
    if (
      lowerQuery.includes('check connectivity') ||
      lowerQuery.includes('test connectivity') ||
      lowerQuery.includes('diagnose') ||
      lowerQuery.includes('run diagnosis') ||
      lowerQuery.includes('ping') ||
      (lowerQuery.includes('is') && lowerQuery.includes('reachable'))
    ) {
      const targetToTest = targetHost || context.lastTarget || 'google.com';

      // Run real or simulated diagnostic test
      const testResult = await runDiagnostics({
        target: targetToTest,
        port: targetPort,
        isSimulated: context.isSimulated || false,
        simulationScenario: context.simulationScenario || 'ALL_SUCCESS'
      });

      // Save report
      await DiagnosticReportRepository.create({
        target: testResult.target,
        port: testResult.port,
        timestamp: testResult.timestamp,
        tests: testResult.tests,
        errorClassifications: testResult.analysis.regexClassification,
        dfaOutput: testResult.analysis.dfaClassification,
        identifiedIssue: testResult.analysis.problem,
        severity: testResult.analysis.severity,
        recommendedSolutions: testResult.analysis.recommendations,
        verificationSteps: testResult.analysis.verificationSteps,
        evidence: testResult.analysis.evidence,
        overallStatus: testResult.overallStatus,
        isSimulated: testResult.isSimulated
      });

      const passedCount = Object.values(testResult.tests).filter(t => t.status === 'success').length;
      const totalCount = Object.values(testResult.tests).length;

      let reply = `### Diagnostic Report for **${targetToTest}** (Port ${targetPort})\n\n`;
      reply += `- **Overall Status**: ${testResult.overallStatus.toUpperCase()} (${passedCount}/${totalCount} tests passed)\n`;
      reply += `- **DFA State**: \`${testResult.analysis.dfaClassification.finalState}\` (${testResult.analysis.dfaClassification.finalStateLabel})\n`;
      reply += `- **Identified Issue**: ${testResult.analysis.problem}\n\n`;

      if (testResult.analysis.severity !== 'None') {
        reply += `**Possible Root Cause:**\n${testResult.analysis.possibleCause}\n\n`;
        reply += `**Recommended Actions:**\n`;
        testResult.analysis.recommendations.forEach((rec, idx) => {
          reply += `${idx + 1}. ${rec}\n`;
        });
      } else {
        reply += `All network checkpoints (Gateway, DNS, Server Echo, and TCP Handshake) responded within healthy latency tolerances.`;
      }

      return res.status(200).json({
        success: true,
        intent: 'RUN_DIAGNOSTICS',
        reply,
        diagnosticData: testResult
      });
    }

    // INTENT B: Identify Failing Network Devices in Topology
    if (
      lowerQuery.includes('devices') ||
      lowerQuery.includes('topology') ||
      lowerQuery.includes('which device') ||
      lowerQuery.includes('failing devices') ||
      lowerQuery.includes('connectivity issues')
    ) {
      const devices = await NetworkDeviceRepository.getAll();
      const failingDevices = devices.filter(d => d.status === 'failed' || d.status === 'warning');

      let reply = `### Network Topology Status\n\n`;
      reply += `Currently monitoring **${devices.length} network devices** in your local topology.\n\n`;

      if (failingDevices.length === 0) {
        reply += `All monitored devices (Gateway, Core Router, Main Switch, Servers, and Workstations) are currently reporting **ACTIVE** and healthy links.`;
      } else {
        reply += `**Alert:** The following device(s) are reporting issues:\n\n`;
        failingDevices.forEach(d => {
          reply += `- **${d.name}** (\`${d.ip}\` - ${d.deviceType.toUpperCase()}): Status **${d.status.toUpperCase()}** - ${d.details}\n`;
        });
        reply += `\n**Recommended Action:** Inspect physical connections and switch port lights on these devices in the Network Topology view.`;
      }

      return res.status(200).json({
        success: true,
        intent: 'INSPECT_DEVICES',
        reply,
        devices
      });
    }

    // INTENT C: Explain Reason for Failed Diagnostic Test
    if (
      lowerQuery.includes('why') ||
      lowerQuery.includes('explain') ||
      lowerQuery.includes('reason') ||
      lowerQuery.includes('fail')
    ) {
      // Fetch latest diagnostic report
      const { reports } = await DiagnosticReportRepository.list({ limit: 1 });
      const latest = reports[0];

      if (!latest) {
        return res.status(200).json({
          success: true,
          intent: 'EXPLAIN_FAILURE',
          reply: `No diagnostic test records were found in history yet. Please run a diagnostic test first by asking: *"Check connectivity to google.com"* or click **Start Diagnosis** on the Network Diagnosis page.`
        });
      }

      let reply = `### Analysis of Recent Diagnostic Test (\`${latest.target}\`)\n\n`;
      reply += `- **Outcome**: ${latest.identifiedIssue} (Severity: ${latest.severity})\n`;
      reply += `- **DFA Diagnostic State**: \`${latest.dfaOutput?.finalState || 'q_trap'}\` (${latest.dfaOutput?.finalStateLabel || 'Evaluated'})\n\n`;

      if (latest.evidence && latest.evidence.length > 0) {
        reply += `**Empirical Diagnostic Evidence:**\n`;
        latest.evidence.forEach(e => {
          reply += `- **${e.test}**: ${e.status.toUpperCase()} — ${e.detail}\n`;
        });
        reply += `\n`;
      }

      if (latest.recommendedSolutions && latest.recommendedSolutions.length > 0) {
        reply += `**Recommended Solutions:**\n`;
        latest.recommendedSolutions.forEach((s, idx) => {
          reply += `${idx + 1}. ${s}\n`;
        });
      }

      return res.status(200).json({
        success: true,
        intent: 'EXPLAIN_FAILURE',
        reply,
        report: latest
      });
    }

    // INTENT D: Suggest Solutions for a Network Problem / DNS / Port
    if (
      lowerQuery.includes('dns') ||
      lowerQuery.includes('name resolution')
    ) {
      const reply = `### DNS Troubleshooting Guide\n\n` +
        `DNS (Domain Name System) translation failures usually stem from local resolver configuration, unresponsive recursive DNS, or UDP port 53 filtering.\n\n` +
        `**Step-by-Step Resolution:**\n` +
        `1. **Verify Local DNS Resolver:**\n` +
        `   - Run \`nslookup <hostname>\` or \`dig <hostname>\` to see which DNS server is responding.\n` +
        `2. **Flush Local DNS Cache:**\n` +
        `   - Windows: \`ipconfig /flushdns\`\n` +
        `   - Linux: \`sudo systemd-resolve --flush-caches\` or \`sudo resolvectl flush-caches\`\n` +
        `   - macOS: \`sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder\`\n` +
        `3. **Test Public DNS Resolvers:**\n` +
        `   - Test Google Public DNS: \`nslookup <hostname> 8.8.8.8\`\n` +
        `   - Test Cloudflare DNS: \`nslookup <hostname> 1.1.1.1\`\n` +
        `4. **Inspect Router DHCP Settings:** Confirm that DHCP assigns valid DNS server IPs to network clients.`;

      return res.status(200).json({
        success: true,
        intent: 'SUGGEST_SOLUTION_DNS',
        reply
      });
    }

    if (
      lowerQuery.includes('port') ||
      lowerQuery.includes('firewall') ||
      lowerQuery.includes('refused') ||
      lowerQuery.includes('timeout')
    ) {
      const reply = `### Port & Firewall Troubleshooting Guide\n\n` +
        `When a host is pingable but TCP connection times out or is refused, the issue lies in the Transport or Application layer.\n\n` +
        `**Root Causes & Solutions:**\n` +
        `1. **Connection Refused (ECONNREFUSED / TCP RST):**\n` +
        `   - The target IP received your packet, but no daemon is listening on that port.\n` +
        `   - Solution: Start the server service (e.g. \`sudo systemctl restart nginx\` or \`docker start <container>\`).\n` +
        `2. **Connection Timed Out (ETIMEDOUT):**\n` +
        `   - Packets are being silently dropped by an intermediate or host-based firewall.\n` +
        `   - Solution: Check iptables / UFW (\`sudo ufw status\`), Windows Firewall, or Cloud Security Groups (AWS SG / GCP Firewall Rules) to permit inbound traffic on target port.`;

      return res.status(200).json({
        success: true,
        intent: 'SUGGEST_SOLUTION_PORT',
        reply
      });
    }

    // DEFAULT / UNSUPPORTED: Clarify supported capabilities
    const helpReply = `I am your **Automated Network Troubleshooting Assistant**.\n\n` +
      `Here are the network diagnostic queries you can ask me:\n` +
      `- *"Check connectivity to google.com"*\n` +
      `- *"Diagnose DNS problems for example.invalid"*\n` +
      `- *"Check whether port 443 is reachable on cloudflare.com"*\n` +
      `- *"Identify devices with connectivity issues in the topology"*\n` +
      `- *"Explain why my recent diagnostic test failed"*\n` +
      `- *"Suggest solutions for a port timeout or firewall block"*\n\n` +
      `Please specify the target domain or IP address you would like to troubleshoot!`;

    return res.status(200).json({
      success: true,
      intent: 'HELP_CAPABILITIES',
      reply: helpReply
    });

  } catch (err) {
    console.error('[AssistantQuery] Error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Error processing assistant query.'
    });
  }
}

export default {
  processAssistantQuery
};
