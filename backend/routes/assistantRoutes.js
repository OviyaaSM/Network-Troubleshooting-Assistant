import express from 'express';
import { processAssistantQuery } from '../controllers/assistantController.js';

const router = express.Router();

router.post('/query', processAssistantQuery);

export default router;
