import express from 'express';

console.log(`[${new Date().toISOString()}] [health.ts] Initializing health check routes...`);

const router = express.Router();

// Super simple health check endpoint that always returns 200 OK
router.get('/healthz', (req, res) => {
  console.log(`[${new Date().toISOString()}] [health.ts] ${req.method} ${req.originalUrl} - Health check request received`);
  res.status(200).send('OK');
  console.log(`[${new Date().toISOString()}] [health.ts] ${req.method} ${req.originalUrl} - Health check response sent: 200 OK`);
});

router.get('/', (req, res) => {
  console.log(`[${new Date().toISOString()}] [health.ts] ${req.method} ${req.originalUrl} - Root endpoint request received`);
  res.status(200).send('Localventure API is running');
  console.log(`[${new Date().toISOString()}] [health.ts] ${req.method} ${req.originalUrl} - Root endpoint response sent: 200 OK`);
});

console.log(`[${new Date().toISOString()}] [health.ts] Health check routes configured`);

export const healthRoutes = router;
