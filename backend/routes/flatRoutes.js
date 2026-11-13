import express from 'express';
import { 
  getDfaSpecification, 
  simulateDfaHandler, 
  testRegexHandler 
} from '../controllers/flatController.js';

const router = express.Router();

router.get('/dfa-spec', getDfaSpecification);
router.post('/simulate-dfa', simulateDfaHandler);
router.post('/match-regex', testRegexHandler);

export default router;
