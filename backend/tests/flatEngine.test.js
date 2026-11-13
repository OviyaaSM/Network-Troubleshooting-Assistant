import { describe, it, expect } from 'vitest';
import { classifyNetworkError, ERROR_PATTERNS } from '../flat-engine/errorPatternMatcher.js';
import { runDFA, normalizeSequence, buildDfaSequenceFromTests } from '../flat-engine/networkDFA.js';

describe('FLAT Engine: Regular Expression Pattern Matcher', () => {
  it('classifies DNS resolution failures correctly', () => {
    const samples = [
      'getaddrinfo ENOTFOUND example.invalid',
      'DNS query returned NXDOMAIN',
      'Name resolution failed for host target.net',
      'SERVFAIL: recursive resolver error'
    ];

    samples.forEach(sample => {
      const result = classifyNetworkError(sample);
      expect(result.code).toBe('DNS_RESOLUTION_FAILURE');
      expect(result.severity).toBe('High');
      expect(result.matchedToken).toBeTruthy();
    });
  });

  it('classifies Connection Timeouts correctly', () => {
    const samples = [
      'connect ETIMEDOUT 198.51.100.1:80',
      'ESOCKETTIMEDOUT: socket inactive',
      'Connection timed out after 3000ms',
      'timeout of 5000ms exceeded'
    ];

    samples.forEach(sample => {
      const result = classifyNetworkError(sample);
      expect(result.code).toBe('CONNECTION_TIMEOUT');
    });
  });

  it('classifies Connection Refused correctly', () => {
    const samples = [
      'connect ECONNREFUSED 127.0.0.1:8080',
      'Connection refused by remote host',
      'target port closed'
    ];

    samples.forEach(sample => {
      const result = classifyNetworkError(sample);
      expect(result.code).toBe('CONNECTION_REFUSED');
    });
  });

  it('classifies Host Unreachable correctly', () => {
    const samples = [
      'EHOSTUNREACH: No route to host',
      'Destination host unreachable from gateway'
    ];

    samples.forEach(sample => {
      const result = classifyNetworkError(sample);
      expect(result.code).toBe('HOST_UNREACHABLE');
    });
  });

  it('classifies Network Unreachable correctly', () => {
    const samples = [
      'connect ENETUNREACH',
      'Network is unreachable'
    ];

    samples.forEach(sample => {
      const result = classifyNetworkError(sample);
      expect(result.code).toBe('NETWORK_UNREACHABLE');
      expect(result.severity).toBe('Critical');
    });
  });

  it('classifies SSL/TLS errors correctly', () => {
    const samples = [
      'Error: CERT_HAS_EXPIRED',
      'UNABLE_TO_VERIFY_LEAF_SIGNER',
      'DEPTH_ZERO_SELF_SIGNED_CERT',
      'tls handshake failed'
    ];

    samples.forEach(sample => {
      const result = classifyNetworkError(sample);
      expect(result.code).toBe('SSL_TLS_FAILURE');
    });
  });

  it('classifies HTTP 4xx and 5xx errors correctly', () => {
    expect(classifyNetworkError('HTTP 502 Bad Gateway').code).toBe('HTTP_SERVER_ERROR');
    expect(classifyNetworkError('HTTP 500 Internal Server Error').code).toBe('HTTP_SERVER_ERROR');
    expect(classifyNetworkError('HTTP 404 Not Found').code).toBe('HTTP_CLIENT_ERROR');
  });

  it('handles unknown or empty errors safely', () => {
    const emptyResult = classifyNetworkError('');
    expect(emptyResult.code).toBe('NO_ERROR');

    const unknownResult = classifyNetworkError('Some completely random application string without network indicators');
    expect(unknownResult.code).toBe('UNKNOWN_NETWORK_ERROR');
    expect(unknownResult.confidence).toBeLessThan(0.5);
  });
});

describe('FLAT Engine: Deterministic Finite Automaton (DFA)', () => {
  it('normalizes sequence strings by removing whitespace and punctuation', () => {
    expect(normalizeSequence('G D S T')).toBe('GDST');
    expect(normalizeSequence('G-d-S')).toBe('GdS');
    expect(normalizeSequence('  g  ')).toBe('g');
  });

  it('accepts sequence "g" as Gateway Failure (State q_g)', () => {
    const result = runDFA('g');
    expect(result.finalState).toBe('q_g');
    expect(result.isAccepted).toBe(true);
    expect(result.diagnosisCode).toBe('LOCAL_GATEWAY_FAILURE');
    expect(result.outcome.severity).toBe('Critical');
  });

  it('accepts sequence "Gd" as DNS Failure (State q_Gd)', () => {
    const result = runDFA('Gd');
    expect(result.finalState).toBe('q_Gd');
    expect(result.isAccepted).toBe(true);
    expect(result.diagnosisCode).toBe('DNS_RESOLUTION_FAILURE');
    expect(result.outcome.severity).toBe('High');
  });

  it('accepts sequence "GDs" as Destination Unreachable (State q_GDs)', () => {
    const result = runDFA('GDs');
    expect(result.finalState).toBe('q_GDs');
    expect(result.isAccepted).toBe(true);
    expect(result.diagnosisCode).toBe('DESTINATION_UNREACHABLE');
  });

  it('accepts sequence "GDSt" as Port / Firewall Blocked (State q_GDSt)', () => {
    const result = runDFA('GDSt');
    expect(result.finalState).toBe('q_GDSt');
    expect(result.isAccepted).toBe(true);
    expect(result.diagnosisCode).toBe('PORT_FIREWALL_BLOCKED');
  });

  it('accepts sequence "GDST" as All Operational (State q_GDST)', () => {
    const result = runDFA('GDST');
    expect(result.finalState).toBe('q_GDST');
    expect(result.isAccepted).toBe(true);
    expect(result.diagnosisCode).toBe('ALL_OPERATIONAL');
    expect(result.outcome.severity).toBe('None');
  });

  it('routes invalid sequences or extra transitions to trap state q_trap', () => {
    const result = runDFA('gG'); // Cannot proceed after gateway failure
    expect(result.finalState).toBe('q_trap');
    expect(result.isAccepted).toBe(false);
  });

  it('builds proper sequence strings from test booleans', () => {
    expect(buildDfaSequenceFromTests({ gateway: false })).toBe('g');
    expect(buildDfaSequenceFromTests({ gateway: true, dns: false })).toBe('Gd');
    expect(buildDfaSequenceFromTests({ gateway: true, dns: true, host: true, tcp: true })).toBe('GDST');
    expect(buildDfaSequenceFromTests({ gateway: true, dns: true, host: true, tcp: false })).toBe('GDSt');
  });
});
