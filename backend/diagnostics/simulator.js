/**
 * Network Diagnostic Simulator
 * 
 * Provides controlled simulation scenarios for academic demonstration
 * and testing without disrupting real hardware or network connections.
 */

export const SIMULATION_SCENARIOS = {
  ALL_SUCCESS: {
    id: 'ALL_SUCCESS',
    name: 'All Systems Operational (Normal Traffic)',
    description: 'Every test passes cleanly (Gateway, DNS, Server, Port, HTTP).',
    sequence: 'GDST',
    results: {
      gateway: {
        name: 'Gateway Connectivity',
        status: 'success',
        gatewayIp: '192.168.1.1',
        latencyMs: 2,
        details: 'Simulated local default gateway 192.168.1.1 responsive.'
      },
      dns: {
        name: 'DNS Resolution',
        status: 'success',
        latencyMs: 14,
        addresses: ['93.184.216.34'],
        details: 'Simulated domain name resolution succeeded.'
      },
      reachability: {
        name: 'Destination Reachability',
        status: 'success',
        latencyMs: 22,
        details: 'Destination responded to echo probes.'
      },
      tcp: {
        name: 'TCP Port Connectivity',
        status: 'success',
        port: 80,
        latencyMs: 24,
        details: 'TCP 3-way handshake established on port 80.'
      },
      http: {
        name: 'HTTP/HTTPS Connectivity',
        status: 'success',
        statusCode: 200,
        statusText: 'OK',
        latencyMs: 38,
        details: 'HTTP GET returned 200 OK.'
      },
      traceroute: {
        name: 'Route Analysis',
        status: 'success',
        supported: true,
        hops: [
          { hop: 1, ip: '192.168.1.1', rtt: '1ms' },
          { hop: 2, ip: '10.50.0.1', rtt: '8ms' },
          { hop: 3, ip: '93.184.216.34', rtt: '24ms' }
        ]
      }
    }
  },

  GATEWAY_DOWN: {
    id: 'GATEWAY_DOWN',
    name: 'Local Gateway Unreachable (Cable / Wi-Fi Down)',
    description: 'Simulates local link down or router offline.',
    sequence: 'g',
    results: {
      gateway: {
        name: 'Gateway Connectivity',
        status: 'failed',
        gatewayIp: '192.168.1.1',
        latencyMs: 1000,
        error: 'Network unreachable: connect ENETUNREACH 192.168.1.1',
        details: 'Default gateway failed to respond to ARP and ICMP requests.'
      },
      dns: {
        name: 'DNS Resolution',
        status: 'failed',
        error: 'getaddrinfo ENOTFOUND (No route to DNS server)',
        details: 'Cannot resolve names because local network interface is down.'
      },
      reachability: {
        name: 'Destination Reachability',
        status: 'failed',
        error: 'Network is unreachable',
        details: 'No route available through local interface.'
      },
      tcp: {
        name: 'TCP Port Connectivity',
        status: 'failed',
        error: 'connect ENETUNREACH',
        details: 'Cannot initiate socket connection.'
      },
      http: {
        name: 'HTTP/HTTPS Connectivity',
        status: 'failed',
        error: 'Network is unreachable'
      }
    }
  },

  DNS_FAILURE: {
    id: 'DNS_FAILURE',
    name: 'DNS Resolution Failure (Misconfigured DNS / NXDOMAIN)',
    description: 'Gateway is up, but domain lookup fails.',
    sequence: 'Gd',
    results: {
      gateway: {
        name: 'Gateway Connectivity',
        status: 'success',
        gatewayIp: '192.168.1.1',
        latencyMs: 3,
        details: 'Local default gateway reachable.'
      },
      dns: {
        name: 'DNS Resolution',
        status: 'failed',
        latencyMs: 120,
        error: 'getaddrinfo ENOTFOUND target.invalid.domain',
        details: 'DNS resolver returned NXDOMAIN for target domain name.'
      },
      reachability: {
        name: 'Destination Reachability',
        status: 'failed',
        error: 'Cannot probe destination without resolved IP address.',
        details: 'Host reachability test blocked by DNS resolution failure.'
      },
      tcp: {
        name: 'TCP Port Connectivity',
        status: 'failed',
        error: 'Cannot establish TCP connection without resolved IP address.'
      },
      http: {
        name: 'HTTP/HTTPS Connectivity',
        status: 'failed',
        error: 'DNS resolution failed before HTTP connection could be initiated.'
      }
    }
  },

  DESTINATION_DOWN: {
    id: 'DESTINATION_DOWN',
    name: 'Destination Host Unreachable / ISP Outage',
    description: 'Gateway and DNS succeed, but target server is unreachable.',
    sequence: 'GDs',
    results: {
      gateway: {
        name: 'Gateway Connectivity',
        status: 'success',
        gatewayIp: '192.168.1.1',
        latencyMs: 2,
        details: 'Local default gateway reachable.'
      },
      dns: {
        name: 'DNS Resolution',
        status: 'success',
        latencyMs: 15,
        addresses: ['198.51.100.42'],
        details: 'Domain resolved to 198.51.100.42'
      },
      reachability: {
        name: 'Destination Reachability',
        status: 'failed',
        latencyMs: 3000,
        error: 'Destination host unreachable (EHOSTUNREACH)',
        details: 'Probes dropped at transit hop 4.'
      },
      tcp: {
        name: 'TCP Port Connectivity',
        status: 'failed',
        error: 'connect ETIMEDOUT 198.51.100.42:80',
        details: 'No SYN-ACK received from destination.'
      },
      http: {
        name: 'HTTP/HTTPS Connectivity',
        status: 'failed',
        error: 'connect ETIMEDOUT 198.51.100.42:80'
      }
    }
  },

  PORT_BLOCKED: {
    id: 'PORT_BLOCKED',
    name: 'TCP Port Closed / Firewall Blocked',
    description: 'Host is alive, but target TCP port refuses connection or drops packets.',
    sequence: 'GDSt',
    results: {
      gateway: {
        name: 'Gateway Connectivity',
        status: 'success',
        gatewayIp: '192.168.1.1',
        latencyMs: 2,
        details: 'Local default gateway reachable.'
      },
      dns: {
        name: 'DNS Resolution',
        status: 'success',
        latencyMs: 12,
        addresses: ['203.0.113.10'],
        details: 'Domain resolved successfully.'
      },
      reachability: {
        name: 'Destination Reachability',
        status: 'success',
        latencyMs: 18,
        details: 'Host responded to ICMP/UDP echo probe.'
      },
      tcp: {
        name: 'TCP Port Connectivity',
        status: 'failed',
        port: 8080,
        error: 'connect ECONNREFUSED 203.0.113.10:8080',
        details: 'Target server sent TCP RST packet; port is closed or blocked.'
      },
      http: {
        name: 'HTTP/HTTPS Connectivity',
        status: 'failed',
        error: 'connect ECONNREFUSED 203.0.113.10:8080'
      }
    }
  }
};

export function getSimulationScenario(scenarioId) {
  return SIMULATION_SCENARIOS[scenarioId] || SIMULATION_SCENARIOS.ALL_SUCCESS;
}

export default {
  SIMULATION_SCENARIOS,
  getSimulationScenario
};
