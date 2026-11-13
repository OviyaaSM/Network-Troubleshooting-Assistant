import { describe, it, expect } from 'vitest';
import { validateDiagnosticTarget, isPrivateOrReservedIP } from '../middleware/ssrfProtection.js';
import { TroubleshootingEngine } from '../flat-engine/troubleshootingEngine.js';
import { checkDNS } from '../diagnostics/dnsCheck.js';

describe('Computer Networks: SSRF & IP Validation', () => {
  it('identifies RFC 1918 and loopback IPs correctly', () => {
    expect(isPrivateOrReservedIP('127.0.0.1')).toBe(true);
    expect(isPrivateOrReservedIP('10.0.0.1')).toBe(true);
    expect(isPrivateOrReservedIP('172.16.0.5')).toBe(true);
    expect(isPrivateOrReservedIP('192.168.1.1')).toBe(true);
    expect(isPrivateOrReservedIP('169.254.169.254')).toBe(true);
    expect(isPrivateOrReservedIP('8.8.8.8')).toBe(false);
    expect(isPrivateOrReservedIP('1.1.1.1')).toBe(false);
  });

  it('validates public target hostnames and blocks internal targets', () => {
    const validDomain = validateDiagnosticTarget('google.com');
    expect(validDomain.valid).toBe(true);
    expect(validDomain.type).toBe('domain');

    const blockedLocalhost = validateDiagnosticTarget('localhost');
    expect(blockedLocalhost.valid).toBe(false);

    const blockedMetadata = validateDiagnosticTarget('169.254.169.254');
    expect(blockedMetadata.valid).toBe(false);

    const malformed = validateDiagnosticTarget('not an ip or domain$$');
    expect(malformed.valid).toBe(false);
  });
});

describe('Computer Networks: Troubleshooting Synthesis Engine', () => {
  it('synthesizes DNS failure recommendations with empirical evidence', () => {
    const analysis = TroubleshootingEngine.analyze({
      target: 'test.invalid',
      port: 80,
      testResults: {
        gateway: { name: 'Gateway Connectivity', status: 'success', gatewayIp: '192.168.1.1' },
        dns: { name: 'DNS Resolution', status: 'failed', error: 'getaddrinfo ENOTFOUND test.invalid' }
      }
    });

    expect(analysis.problem).toBe('DNS Name Resolution Failure');
    expect(analysis.severity).toBe('High');
    expect(analysis.recommendations.length).toBeGreaterThan(0);
    expect(analysis.dfaClassification.finalState).toBe('q_Gd');
    expect(analysis.regexClassification.code).toBe('DNS_RESOLUTION_FAILURE');
  });

  it('synthesizes Port Blocked recommendations when host is up but TCP fails', () => {
    const analysis = TroubleshootingEngine.analyze({
      target: '93.184.216.34',
      port: 8080,
      testResults: {
        gateway: { name: 'Gateway Connectivity', status: 'success' },
        dns: { name: 'DNS Resolution', status: 'success' },
        reachability: { name: 'Destination Reachability', status: 'success' },
        tcp: { name: 'TCP Port Connectivity', status: 'failed', error: 'connect ECONNREFUSED' }
      }
    });

    expect(analysis.problem).toContain('TCP Port 8080 Connection Refused');
    expect(analysis.dfaClassification.finalState).toBe('q_GDSt');
    expect(analysis.regexClassification.code).toBe('CONNECTION_REFUSED');
  });
});
