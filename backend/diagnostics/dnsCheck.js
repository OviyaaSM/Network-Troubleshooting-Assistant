/**
 * DNS Resolution Diagnostic Module
 * Performs actual DNS resolution using Node.js dns.promises.
 */

import dns from 'dns';

export async function checkDNS(target, options = {}) {
  const timeoutMs = options.timeoutMs || 4000;
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(target);

  if (isIp) {
    return {
      name: 'DNS Resolution',
      status: 'success',
      latencyMs: 0,
      addresses: [target],
      family: 4,
      details: 'Target is already an IP address. Direct routing bypassed DNS lookup.',
      isIpTarget: true
    };
  }

  const startTime = Date.now();

  try {
    const lookupPromise = dns.promises.lookup(target, { all: true });
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`DNS resolution timed out after ${timeoutMs}ms`)), timeoutMs)
    );

    const results = await Promise.race([lookupPromise, timeoutPromise]);
    const latencyMs = Date.now() - startTime;
    const addresses = results.map(r => r.address);

    return {
      name: 'DNS Resolution',
      status: 'success',
      latencyMs,
      addresses,
      family: results[0]?.family || 4,
      details: `Resolved ${target} to ${addresses.join(', ')}`,
      ttl: 300
    };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    return {
      name: 'DNS Resolution',
      status: 'failed',
      latencyMs,
      error: err.message || 'DNS resolution failed',
      code: err.code || 'ENOTFOUND',
      details: `Failed to resolve domain: ${err.message}`
    };
  }
}

export default checkDNS;
