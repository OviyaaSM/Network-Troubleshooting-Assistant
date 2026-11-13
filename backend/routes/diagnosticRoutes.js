import express from 'express';
import { 
  runDiagnosticHandler, 
  getDiagnosticHistoryHandler, 
  getDiagnosticReportByIdHandler,
  getScenariosHandler 
} from '../controllers/diagnosticController.js';
import { ssrfMiddleware } from '../middleware/ssrfProtection.js';

const router = express.Router();

router.post('/run', ssrfMiddleware, runDiagnosticHandler);
router.get('/history', getDiagnosticHistoryHandler);
router.get('/scenarios', getScenariosHandler);
router.get('/:id', getDiagnosticReportByIdHandler);

export default router;
