/**
 * FLAT Engine: Regular Expression-Based Network Error Detection
 * 
 * Formal Languages and Automata Theory (FLAT) Module:
 * Employs regular expressions (Regular Grammars / Type-3 Chomsky Hierarchy)
 * to parse unstructured diagnostic text, syslog entries, and Node.js socket
 * errors into formal syntactic categories.
 */

export const ERROR_PATTERNS = [
  {
    code: 'DNS_RESOLUTION_FAILURE',
    category: 'DNS Failure',
    regex: /(?:getaddrinfo\s+(?:ENOTFOUND|EAI_AGAIN)|NXDOMAIN|SERVFAIL|name\s+resolution\s+(?:failed|failure)|cannot\s+resolve\s+host)/i,
    severity: 'High',
    confidence: 0.95,
    explanation: 'The system failed to translate the target domain name into a valid IP address via configured DNS servers.',
    suggestedAction: 'Verify target hostname spelling, check primary/secondary DNS server settings (e.g., 8.8.8.8, 1.1.1.1), or flush local DNS cache.'
  },
  {
    code: 'CONNECTION_TIMEOUT',
    category: 'Connection Timeout',
    regex: /(?:connect\s+ETIMEDOUT|ESOCKETTIMEDOUT|Connection\s+timed\s+out|timed?\s*out|request\s+timed\s+out|timeout\s+of\s+\d+ms\s+exceeded)/i,
    severity: 'Medium',
    confidence: 0.90,
    explanation: 'A socket connection was attempted, but no SYN-ACK or response was received within the maximum timeout window.',
    suggestedAction: 'Check for network congestion, restrictive intermediate firewalls dropping SYN packets, or destination host offline status.'
  },
  {
    code: 'CONNECTION_REFUSED',
    category: 'Connection Refused',
    regex: /(?:ECONNREFUSED|Connection\s+refused|port\s+closed|connection\s+actively\s+rejected)/i,
    severity: 'Medium',
    confidence: 0.95,
    explanation: 'The destination host was reached, but it actively returned a TCP RST packet indicating no service is listening on the target port.',
    suggestedAction: 'Ensure the target daemon (web server, SSH, etc.) is running and bound to the requested port and external interface.'
  },
  {
    code: 'HOST_UNREACHABLE',
    category: 'Host Unreachable',
    regex: /(?:EHOSTUNREACH|No\s+route\s+to\s+host|Destination\s+host\s+unreachable|host\s+unreachable)/i,
    severity: 'High',
    confidence: 0.92,
    explanation: 'An intermediate router or the local gateway reported that there is no route in the forwarding table to reach the destination IP.',
    suggestedAction: 'Verify default gateway settings, check routing tables, and test gateway reachability.'
  },
  {
    code: 'NETWORK_UNREACHABLE',
    category: 'Network Unreachable',
    regex: /(?:ENETUNREACH|Network\s+is\s+unreachable|Network\s+unreachable)/i,
    severity: 'Critical',
    confidence: 0.96,
    explanation: 'The local network interface has no path to the requested IP subnet, often indicating that the physical link or local gateway is down.',
    suggestedAction: 'Check physical cable/Wi-Fi connection, verify local IP address lease from DHCP, and ensure network adapter is enabled.'
  },
  {
    code: 'INVALID_IP_ADDRESS',
    category: 'Invalid IP / Syntax Error',
    regex: /(?:Invalid\s+IP\s+address|bad\s+address|EINVAL.*(?:address|ip)|malformed\s+(?:ip|ipv4|ipv6))/i,
    severity: 'Low',
    confidence: 0.98,
    explanation: 'The target IP string does not conform to standard IPv4 dotted-decimal (RFC 791) or IPv6 syntax.',
    suggestedAction: 'Provide a valid IPv4 (e.g. 192.168.1.1) or standard FQDN hostname (e.g. example.com).'
  },
  {
    code: 'SSL_TLS_FAILURE',
    category: 'SSL / TLS Handshake Failure',
    regex: /(?:CERT_HAS_EXPIRED|UNABLE_TO_VERIFY_LEAF_SIGNER|DEPTH_ZERO_SELF_SIGNED_CERT|SSL_ERROR|certificate\s+has\s+expired|self\s*signed\s*certificate|tls\s+handshake\s+failed|ERR_SSL_)/i,
    severity: 'High',
    confidence: 0.94,
    explanation: 'The cryptographic TLS handshake failed due to expired, self-signed, or untrusted digital certificate authority.',
    suggestedAction: 'Renew TLS certificate, verify domain name match in SAN (Subject Alternative Name), or check system clock synchronization.'
  },
  {
    code: 'HTTP_SERVER_ERROR',
    category: 'HTTP 5xx Server Error',
    regex: /(?:500\s+Internal\s+Server\s+Error|502\s+Bad\s+Gateway|503\s+Service\s+Unavailable|504\s+Gateway\s+Timeout|HTTP\s*5\d{2})/i,
    severity: 'Medium',
    confidence: 0.90,
    explanation: 'The TCP and HTTP connection succeeded, but the upstream application server encountered an internal error or reverse proxy gateway failure.',
    suggestedAction: 'Check backend application logs, reverse proxy routing (Nginx/Envoy), and upstream database connections.'
  },
  {
    code: 'HTTP_CLIENT_ERROR',
    category: 'HTTP 4xx Client Error',
    regex: /(?:400\s+Bad\s+Request|401\s+Unauthorized|403\s+Forbidden|404\s+Not\s+Found|HTTP\s*4\d{2})/i,
    severity: 'Low',
    confidence: 0.90,
    explanation: 'The target server is operational but rejected the client HTTP request due to authorization, route missing, or bad parameters.',
    suggestedAction: 'Verify the URL path, query parameters, API keys, and HTTP headers.'
  }
];

/**
 * Classifies a raw error message string using regular expression pattern matching.
 * @param {string|Error} rawInput - The error string or Error object to classify.
 * @returns {Object} Structured error classification with matched regex, token, and advice.
 */
export function classifyNetworkError(rawInput) {
  if (!rawInput) {
    return {
      code: 'NO_ERROR',
      category: 'No Error Detected',
      regexPattern: null,
      matchedToken: null,
      severity: 'None',
      confidence: 1.0,
      explanation: 'No network errors were detected or reported.',
      suggestedAction: 'Continue with normal operations.'
    };
  }

  const message = typeof rawInput === 'string' ? rawInput : (rawInput.message || rawInput.toString());

  for (const pattern of ERROR_PATTERNS) {
    const match = message.match(pattern.regex);
    if (match) {
      return {
        code: pattern.code,
        category: pattern.category,
        regexPattern: pattern.regex.toString(),
        matchedToken: match[0],
        severity: pattern.severity,
        confidence: pattern.confidence,
        explanation: pattern.explanation,
        suggestedAction: pattern.suggestedAction,
        rawInput: message
      };
    }
  }

  return {
    code: 'UNKNOWN_NETWORK_ERROR',
    category: 'Unclassified Network Error',
    regexPattern: null,
    matchedToken: null,
    severity: 'Medium',
    confidence: 0.40,
    explanation: 'The diagnostic error message did not match standard network error signatures.',
    suggestedAction: 'Inspect raw logs and verify physical layer, routing tables, and server status.',
    rawInput: message
  };
}

export default {
  ERROR_PATTERNS,
  classifyNetworkError
};
