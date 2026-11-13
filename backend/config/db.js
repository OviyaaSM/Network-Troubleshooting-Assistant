/**
 * MongoDB Database Connection Manager
 * 
 * Implements serverless connection caching and automatic resilient in-memory
 * fallback when MONGODB_URI is absent or unreachable.
 */

import mongoose from 'mongoose';

let cachedConnection = global.mongooseConnection || null;
let isUsingFallback = false;

// In-memory collections for resilient fallback
export const inMemoryStore = {
  reports: [],
  devices: [
    {
      _id: 'dev-1',
      name: 'Internet Gateway / WAN',
      ip: '198.51.100.1',
      deviceType: 'gateway',
      status: 'active',
      details: 'Border Gateway Router (BGP / NAT)',
      connections: ['dev-2']
    },
    {
      _id: 'dev-2',
      name: 'Core Router',
      ip: '192.168.1.1',
      deviceType: 'router',
      status: 'active',
      details: 'Layer 3 Default Gateway (DHCP / DNS Forwarder)',
      connections: ['dev-3', 'dev-4']
    },
    {
      _id: 'dev-3',
      name: 'Main Distribution Switch',
      ip: '192.168.1.2',
      deviceType: 'switch',
      status: 'active',
      details: 'Managed 24-Port Gigabit Switch (VLAN 10/20)',
      connections: ['dev-5', 'dev-6', 'dev-7']
    },
    {
      _id: 'dev-4',
      name: 'DNS Resolver Server',
      ip: '192.168.1.5',
      deviceType: 'server',
      status: 'active',
      details: 'Internal DNS / BIND 9 Service',
      connections: []
    },
    {
      _id: 'dev-5',
      name: 'Workstation 01',
      ip: '192.168.1.101',
      deviceType: 'workstation',
      status: 'active',
      details: 'Client Host (Windows 11)',
      connections: []
    },
    {
      _id: 'dev-6',
      name: 'Workstation 02',
      ip: '192.168.1.102',
      deviceType: 'workstation',
      status: 'active',
      details: 'Client Host (Ubuntu Linux)',
      connections: []
    },
    {
      _id: 'dev-7',
      name: 'Web Application Server',
      ip: '192.168.1.200',
      deviceType: 'server',
      status: 'active',
      details: 'Nginx Reverse Proxy / Port 80, 443',
      connections: []
    }
  ]
};

export async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    isUsingFallback = true;
    console.log('[DB] MONGODB_URI not configured. Operating in high-reliability in-memory store mode.');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
      bufferCommands: false
    });
    cachedConnection = conn;
    global.mongooseConnection = conn;
    isUsingFallback = false;
    console.log(`[DB] Connected to MongoDB: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    isUsingFallback = true;
    console.warn(`[DB] MongoDB connection failed (${err.message}). Using resilient in-memory fallback.`);
    return null;
  }
}

export function isDbUsingFallback() {
  return isUsingFallback || mongoose.connection.readyState !== 1;
}

export default {
  connectDB,
  isDbUsingFallback,
  inMemoryStore
};
