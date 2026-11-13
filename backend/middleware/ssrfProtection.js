/**
 * SSRF and Input Validation Guard
 * 
 * Prevents Server-Side Request Forgery (SSRF) by validating target hostnames and IPs.
 * Disallows loopback (127.0.0.0/8), link-local / cloud metadata (169.254.169.254),
 * and private RFC 1918 addresses in remote diagnostic mode unless explicitly allowed (e.g. simulation or local gateway check).
 */

const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '0.0.0.0',
  '169.254.169.254', // AWS/GCP/Azure instance metadata
  'metadata.google.internal'
]);

// IP regex helpers
const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const DOMAIN_REGEX = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*\.[A-Za-z]{2,}$/;

export function isPrivateOrReservedIP(ip) {
  if (!IPV4_REGEX.test(ip)) return false;

  const parts = ip.split('.').map(Number);
  
  // 127.0.0.0/8 (Loopback)
  if (parts[0] === 127) return true;
  // 10.0.0.0/8 (Private)
  if (parts[0] === 10) return true;
  // 172.16.0.0/12 (Private)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.0.0/16 (Private)
  if (parts[0] === 192 && parts[1] === 168) return true;
  // 169.254.0.0/16 (Link Local / Cloud Metadata)
  if (parts[0] === 169 && parts[1] === 254) return true;
  // 0.0.0.0/8
  if (parts[0] === 0) return true;

  return false;
}

export function validateDiagnosticTarget(target, { allowPrivate = false } = {}) {
  if (!target || typeof target !== 'string') {
    return { valid: false, error: 'Target domain or IP address is required.' };
  }

  const cleanTarget = target.trim().toLowerCase();

  if (cleanTarget.length > 253) {
    return { valid: false, error: 'Target hostname exceeds maximum length.' };
  }

  // Check static blocked hosts
  if (BLOCKED_HOSTS.has(cleanTarget)) {
    if (!allowPrivate) {
      return { valid: false, error: 'Access to loopback or cloud metadata endpoints is prohibited.' };
    }
  }

  // Check IPv4
  if (IPV4_REGEX.test(cleanTarget)) {
    if (!allowPrivate && isPrivateOrReservedIP(cleanTarget)) {
      return {
        valid: false,
        error: 'Private and internal IP ranges (RFC 1918 / Cloud Metadata) are restricted for security.'
      };
    }
    return { valid: true, type: 'ipv4', target: cleanTarget };
  }

  // Check Domain Name
  if (DOMAIN_REGEX.test(cleanTarget)) {
    return { valid: true, type: 'domain', target: cleanTarget };
  }

  return {
    valid: false,
    error: 'Invalid target format. Please provide a valid FQDN (e.g. google.com) or IPv4 address.'
  };
}

export function ssrfMiddleware(req, res, next) {
  const { target, isSimulated } = req.body;

  // In simulated mode, allow simulated addresses for testing scenarios
  if (isSimulated) {
    return next();
  }

  if (target) {
    const check = validateDiagnosticTarget(target, { allowPrivate: false });
    if (!check.valid) {
      return res.status(400).json({
        success: false,
        error: check.error,
        code: 'SSRF_VALIDATION_ERROR'
      });
    }
  }

  next();
}

export default {
  validateDiagnosticTarget,
  isPrivateOrReservedIP,
  ssrfMiddleware
};
