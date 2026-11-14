import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import diagnosticRoutes from './routes/diagnosticRoutes.js';
import assistantRoutes from './routes/assistantRoutes.js';
import networkRoutes from './routes/networkRoutes.js';
import flatRoutes from './routes/flatRoutes.js';
import { healthCheckHandler } from './controllers/networkController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (with resilient in-memory fallback)
connectDB().catch(err => console.warn('[App] Initial DB connect warning:', err.message));

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or matching origins or Render deployments (*.onrender.com)
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com') || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for academic evaluation
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request Logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// Root & Health Endpoints
app.get('/', (req, res) => {
  res.json({
    name: 'Automated Network Troubleshooting Assistant API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: {
      diagnostics: '/api/diagnostics/run',
      history: '/api/diagnostics/history',
      assistant: '/api/assistant/query',
      topology: '/api/network/topology',
      networkStatus: '/api/network/status',
      flatSpec: '/api/flat/dfa-spec',
      health: '/api/health'
    }
  });
});

app.get('/api/health', healthCheckHandler);

// API Routes
app.use('/api/diagnostics', diagnosticRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/flat', flatRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.path}`,
    code: 'ROUTE_NOT_FOUND'
  });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    code: err.code || 'SERVER_ERROR'
  });
});

// Start Server for Render Persistent Web Service
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Server] Automated Network Troubleshooting Assistant running on port ${PORT}`);
  });
}

export default app;
