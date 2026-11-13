/**
 * NetworkDevice Mongoose Model & Storage Service
 */

import mongoose from 'mongoose';
import { inMemoryStore, isDbUsingFallback } from '../config/db.js';

const networkDeviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ip: { type: String, required: true },
  deviceType: { 
    type: String, 
    enum: ['gateway', 'router', 'switch', 'server', 'workstation', 'firewall'], 
    default: 'workstation' 
  },
  status: { 
    type: String, 
    enum: ['active', 'warning', 'failed', 'offline'], 
    default: 'active' 
  },
  details: { type: String, default: '' },
  connections: [{ type: String }]
}, {
  timestamps: true
});

const MongoNetworkDevice = mongoose.models.NetworkDevice || mongoose.model('NetworkDevice', networkDeviceSchema);

export class NetworkDeviceRepository {
  static async getAll() {
    if (!isDbUsingFallback()) {
      try {
        const count = await MongoNetworkDevice.countDocuments();
        if (count === 0) {
          // Seed defaults
          await MongoNetworkDevice.insertMany(inMemoryStore.devices);
        }
        return await MongoNetworkDevice.find().lean();
      } catch (err) {
        console.warn('[DB] Fallback device read:', err.message);
      }
    }
    return inMemoryStore.devices;
  }

  static async updateStatus(deviceId, status) {
    if (!isDbUsingFallback()) {
      try {
        const updated = await MongoNetworkDevice.findByIdAndUpdate(deviceId, { status }, { new: true });
        if (updated) return updated.toObject();
      } catch (err) {
        // Fallback
      }
    }

    const dev = inMemoryStore.devices.find(d => d._id === deviceId);
    if (dev) {
      dev.status = status;
      return dev;
    }
    return null;
  }
}

export default MongoNetworkDevice;
