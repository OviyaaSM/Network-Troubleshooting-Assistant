/**
 * Destination Reachability / Ping Diagnostic Module
 * Abstraction layer for ICMP/TCP reachability.
 * 
 * Verifies host reachability using TCP probe fallback when raw ICMP is not permitted 
 * by the runtime OS/serverless sandbox (e.g. non-root on Linux / Vercel serverless).
 */

import net from 'net';

export async function checkReachability(target, options = {}) {
  const timeoutMs = options.timeoutMs || 3000;
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
  const startTime = Date.now();

  // Test reachability via standard TCP SYN probe on port 80/443
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    socket.setTimeout(timeoutMs);

    socket.connect(options.port || 80, target, () => {
      if (settled) return;
      settled = true;
      const latencyMs = Date.now() - startTime;
      socket.destroy();
      resolve({
        name: 'Destination Reachability',
        status: 'success',
        latencyMs,
        target,
        method: isServerless ? 'TCP-SYN-Probe (Serverless Mode)' : 'TCP-Probe',
        details: `Destination ${target} responded in ${latencyMs}ms.`,
        icmpSupported: false,
        note: 'Probed via TCP handshake (Raw ICMP is restricted in unprivileged container environments).'
      });
    });

    socket.on('error', (err) => {
      if (settled) return;
      settled = true;
      const latencyMs = Date.now() - startTime;
      socket.destroy();

      // If connection was refused (RST), the host is definitely REACHABLE!
      if (err.code === 'ECONNREFUSED') {
        resolve({
          name: 'Destination Reachability',
          status: 'success',
          latencyMs,
          target,
          method: 'TCP-RST-Reflection',
          details: `Destination ${target} responded with TCP RST (Host is active and routable).`,
          icmpSupported: false
        });
      } else {
        resolve({
          name: 'Destination Reachability',
          status: 'failed',
          latencyMs,
          target,
          error: err.message,
          code: err.code || 'EHOSTUNREACH',
          details: `Host reachability probe failed: ${err.message}`
        });
      }
    });

    socket.on('timeout', () => {
      if (settled) return;
      settled = true;
      socket.destroy();
      const latencyMs = Date.now() - startTime;
      resolve({
        name: 'Destination Reachability',
        status: 'failed',
        latencyMs,
        target,
        error: `Echo probe to ${target} timed out after ${timeoutMs}ms`,
        code: 'ETIMEDOUT',
        details: 'No response received from destination within the timeout threshold.'
      });
    });
  });
}

export default checkReachability;
