/**
 * Network Status & Topology Controller
 */

import { NetworkDeviceRepository } from '../models/NetworkDevice.js';
import { DiagnosticReportRepository } from '../models/DiagnosticReport.js';
import { checkGateway } from '../diagnostics/gatewayCheck.js';

export async function getTopologyHandler(req, res) {
  try {
    const devices = await NetworkDeviceRepository.getAll();
    res.status(200).json({
      success: true,
      devices
    });
  } catch (err) {
    console.error('[GetTopology] Error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve topology devices.'
    });
  }
}

export async function updateDeviceStatusHandler(req, res) {
  try {
    const { deviceId, status } = req.body;
    if (!deviceId || !status) {
      return res.status(400).json({
        success: false,
        error: 'deviceId and status are required.'
      });
    }

    const updated = await NetworkDeviceRepository.updateStatus(deviceId, status);
    res.status(200).json({
      success: true,
      device: updated
    });
  } catch (err) {
    console.error('[UpdateDeviceStatus] Error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update device status.'
    });
  }
}

export async function getNetworkStatusHandler(req, res) {
  try {
    const stats = await DiagnosticReportRepository.getStats();
    let localGateway = null;

    try {
      localGateway = await checkGateway();
    } catch (e) {
      localGateway = { status: 'failed', error: e.message };
    }

    const { reports: recentActivity } = await DiagnosticReportRepository.list({ limit: 5 });

    res.status(200).json({
      success: true,
      stats: {
        ...stats,
        localGatewayIp: localGateway.gatewayIp || '192.168.1.1',
        gatewayStatus: localGateway.status || 'success',
        activeInterfaces: localGateway.activeInterfaces || []
      },
      recentActivity
    });
  } catch (err) {
    console.error('[GetNetworkStatus] Error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve network status overview.'
    });
  }
}

export async function healthCheckHandler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Automated Network Troubleshooting Assistant Backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    serverless: Boolean(process.env.VERCEL)
  });
}

export default {
  getTopologyHandler,
  updateDeviceStatusHandler,
  getNetworkStatusHandler,
  healthCheckHandler
};
