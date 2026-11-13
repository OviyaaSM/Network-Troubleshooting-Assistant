import express from 'express';
import { 
  getTopologyHandler, 
  updateDeviceStatusHandler, 
  getNetworkStatusHandler, 
  healthCheckHandler 
} from '../controllers/networkController.js';

const router = express.Router();

router.get('/topology', getTopologyHandler);
router.post('/topology/device', updateDeviceStatusHandler);
router.get('/status', getNetworkStatusHandler);
router.get('/health', healthCheckHandler);

export default router;
