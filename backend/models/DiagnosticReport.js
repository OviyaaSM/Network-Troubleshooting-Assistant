/**
 * DiagnosticReport Mongoose Model & Storage Service
 */

import mongoose from 'mongoose';
import { inMemoryStore, isDbUsingFallback } from '../config/db.js';

const diagnosticReportSchema = new mongoose.Schema({
  target: { type: String, required: true },
  port: { type: Number, default: 80 },
  timestamp: { type: Date, default: Date.now },
  tests: { type: Object, default: {} },
  errorClassifications: { type: Object, default: {} },
  dfaOutput: { type: Object, default: {} },
  identifiedIssue: { type: String, required: true },
  severity: { type: String, default: 'Low' },
  recommendedSolutions: [{ type: String }],
  verificationSteps: [{ type: String }],
  evidence: [{ type: Object }],
  overallStatus: { type: String, enum: ['success', 'warning', 'failed'], default: 'success' },
  isSimulated: { type: Boolean, default: false },
  simulationScenario: { type: String, default: null }
}, {
  timestamps: true
});

const MongoDiagnosticReport = mongoose.models.DiagnosticReport || mongoose.model('DiagnosticReport', diagnosticReportSchema);

export class DiagnosticReportRepository {
  static async create(reportData) {
    if (!isDbUsingFallback()) {
      try {
        const doc = await MongoDiagnosticReport.create(reportData);
        return doc.toObject();
      } catch (err) {
        console.warn('[DB] Fallback write to in-memory store:', err.message);
      }
    }

    const fallbackDoc = {
      _id: 'rep-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      ...reportData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    inMemoryStore.reports.unshift(fallbackDoc);
    // Keep max 100 reports in memory
    if (inMemoryStore.reports.length > 100) {
      inMemoryStore.reports.pop();
    }
    return fallbackDoc;
  }

  static async findById(id) {
    if (!isDbUsingFallback()) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          const doc = await MongoDiagnosticReport.findById(id).lean();
          if (doc) return doc;
        }
      } catch (err) {
        // Fall back to memory check
      }
    }

    return inMemoryStore.reports.find(r => r._id === id || r.id === id) || null;
  }

  static async list({ limit = 20, offset = 0 } = {}) {
    if (!isDbUsingFallback()) {
      try {
        const docs = await MongoDiagnosticReport.find()
          .sort({ createdAt: -1 })
          .skip(offset)
          .limit(limit)
          .lean();
        const total = await MongoDiagnosticReport.countDocuments();
        return { reports: docs, total };
      } catch (err) {
        console.warn('[DB] Fallback read from in-memory store:', err.message);
      }
    }

    const total = inMemoryStore.reports.length;
    const reports = inMemoryStore.reports.slice(offset, offset + limit);
    return { reports, total };
  }

  static async getStats() {
    let reports = [];
    if (!isDbUsingFallback()) {
      try {
        reports = await MongoDiagnosticReport.find().lean();
      } catch (err) {
        reports = inMemoryStore.reports;
      }
    } else {
      reports = inMemoryStore.reports;
    }

    const total = reports.length;
    const successful = reports.filter(r => r.overallStatus === 'success').length;
    const failed = reports.filter(r => r.overallStatus === 'failed').length;
    const warning = reports.filter(r => r.overallStatus === 'warning').length;

    const recentIssues = reports
      .filter(r => r.overallStatus !== 'success')
      .slice(0, 5)
      .map(r => ({
        id: r._id,
        target: r.target,
        issue: r.identifiedIssue,
        severity: r.severity,
        timestamp: r.createdAt || r.timestamp
      }));

    return {
      totalTests: total,
      successfulTests: successful,
      failedTests: failed,
      warningTests: warning,
      overallHealth: total === 0 ? 'Healthy' : (failed / total > 0.4 ? 'Degraded' : 'Operational'),
      recentIssues
    };
  }
}

export default MongoDiagnosticReport;
