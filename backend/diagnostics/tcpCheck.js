/**
 * TCP Port Connectivity Diagnostic Module
 * Establishes a true TCP socket connection to test transport layer reachability.
 */

import net from 'net';

export async function checkTCP(target, port = 80, options = {}) {
  const timeoutMs = options.timeoutMs || 4000;
  const startTime = Date.now();

  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isSettled = false;

    const cleanup = () => {
      socket.removeAllListeners();
      socket.destroy();
    };

    socket.setTimeout(timeoutMs);

    socket.connect(port, target, () => {
      if (isSettled) return;
      isSettled = true;
      const latencyMs = Date.now() - startTime;
      cleanup();
      resolve({
        name: 'TCP Port Connectivity',
        port,
        status: 'success',
        latencyMs,
        details: `Successfully established TCP 3-way handshake to ${target}:${port}`,
        target
      });
    });

    socket.on('timeout', () => {
      if (isSettled) return;
      isSettled = true;
      const latencyMs = Date.now() - startTime;
      cleanup();
      resolve({
        name: 'TCP Port Connectivity',
        port,
        status: 'failed',
        latencyMs,
        error: `connect ETIMEDOUT ${target}:${port} (timed out after ${timeoutMs}ms)`,
        code: 'ETIMEDOUT',
        details: `Connection to ${target}:${port} timed out without SYN-ACK response.`
      });
    });

    socket.on('error', (err) => {
      if (isSettled) return;
      isSettled = true;
      const latencyMs = Date.now() - startTime;
      cleanup();
      resolve({
        name: 'TCP Port Connectivity',
        port,
        status: 'failed',
        latencyMs,
        error: err.message || `connect ECONNREFUSED ${target}:${port}`,
        code: err.code || 'ECONNREFUSED',
        details: `TCP handshake failed: ${err.message}`
      });
    });
  });
}

export default checkTCP;
