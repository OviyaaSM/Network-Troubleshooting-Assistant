/**
 * HTTP / HTTPS Connectivity Diagnostic Module
 * Executes real HTTP/HTTPS HEAD or GET requests to verify application layer health.
 */

import http from 'http';
import https from 'https';

export async function checkHTTP(target, options = {}) {
  const timeoutMs = options.timeoutMs || 5000;
  const protocol = options.protocol || (options.port === 443 ? 'https' : 'http');
  const port = options.port || (protocol === 'https' ? 443 : 80);
  
  // Format URL
  let url = target.startsWith('http://') || target.startsWith('https://')
    ? target
    : `${protocol}://${target}:${port}`;

  const client = url.startsWith('https://') ? https : http;
  const startTime = Date.now();

  return new Promise((resolve) => {
    let isSettled = false;

    const req = client.get(url, {
      timeout: timeoutMs,
      headers: { 'User-Agent': 'NetworkTroubleshootingAssistant/1.0' }
    }, (res) => {
      if (isSettled) return;
      isSettled = true;
      const latencyMs = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Consume response to free socket
      res.resume();

      const isSuccess = statusCode >= 200 && statusCode < 400;

      resolve({
        name: 'HTTP/HTTPS Connectivity',
        status: isSuccess ? 'success' : (statusCode >= 500 ? 'failed' : 'warning'),
        statusCode,
        statusText: res.statusMessage,
        latencyMs,
        protocol: url.startsWith('https') ? 'HTTPS' : 'HTTP',
        url,
        details: `HTTP ${statusCode} ${res.statusMessage} received in ${latencyMs}ms`,
        error: !isSuccess ? `HTTP Status ${statusCode} ${res.statusMessage}` : null
      });
    });

    req.on('timeout', () => {
      if (isSettled) return;
      isSettled = true;
      req.destroy();
      const latencyMs = Date.now() - startTime;
      resolve({
        name: 'HTTP/HTTPS Connectivity',
        status: 'failed',
        latencyMs,
        error: `HTTP request timed out after ${timeoutMs}ms`,
        code: 'ETIMEDOUT',
        details: 'The web server did not respond to the HTTP request within the timeout limit.'
      });
    });

    req.on('error', (err) => {
      if (isSettled) return;
      isSettled = true;
      const latencyMs = Date.now() - startTime;
      resolve({
        name: 'HTTP/HTTPS Connectivity',
        status: 'failed',
        latencyMs,
        error: err.message,
        code: err.code || 'HTTP_ERROR',
        details: `HTTP connection error: ${err.message}`
      });
    });
  });
}

export default checkHTTP;
