/**
 * Diagnostic Controller
 */

import { runDiagnostics } from '../diagnostics/diagnosticRunner.js';
import { DiagnosticReportRepository } from '../models/DiagnosticReport.js';
import { SIMULATION_SCENARIOS } from '../diagnostics/simulator.js';

export async function runDiagnosticHandler(req, res) {
  try {
    const { target = 'google.com', port = 80, protocol = 'http', isSimulated = false, simulationScenario = 'ALL_SUCCESS' } = req.body;

    const result = await runDiagnostics({
      target,
      port,
      protocol,
      isSimulated,
      simulationScenario
    });

    // Save report to database/store
    const savedReport = await DiagnosticReportRepository.create({
      target: result.target,
      port: result.port,
      timestamp: result.timestamp,
      tests: result.tests,
      errorClassifications: result.analysis.regexClassification,
      dfaOutput: result.analysis.dfaClassification,
      identifiedIssue: result.analysis.problem,
      severity: result.analysis.severity,
      recommendedSolutions: result.analysis.recommendations,
      verificationSteps: result.analysis.verificationSteps,
      evidence: result.analysis.evidence,
      overallStatus: result.overallStatus,
      isSimulated: result.isSimulated,
      simulationScenario: result.simulationScenario
    });

    res.status(200).json({
      success: true,
      reportId: savedReport._id,
      data: {
        ...result,
        id: savedReport._id
      }
    });
  } catch (err) {
    console.error('[DiagnosticHandler] Error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal error executing diagnostic test.'
    });
  }
}

export async function getDiagnosticHistoryHandler(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;
    const history = await DiagnosticReportRepository.list({ limit, offset });

    res.status(200).json({
      success: true,
      ...history
    });
  } catch (err) {
    console.error('[DiagnosticHistoryHandler] Error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Could not retrieve diagnostic history.'
    });
  }
}

export async function getDiagnosticReportByIdHandler(req, res) {
  try {
    const { id } = req.params;
    const report = await DiagnosticReportRepository.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: `Diagnostic report with ID '${id}' not found.`
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (err) {
    console.error('[GetReportByIdHandler] Error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to retrieve diagnostic report.'
    });
  }
}

export async function getScenariosHandler(req, res) {
  res.status(200).json({
    success: true,
    scenarios: Object.values(SIMULATION_SCENARIOS).map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      sequence: s.sequence
    }))
  });
}

export default {
  runDiagnosticHandler,
  getDiagnosticHistoryHandler,
  getDiagnosticReportByIdHandler,
  getScenariosHandler
};
