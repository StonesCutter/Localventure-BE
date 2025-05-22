// Minimal Express server for testing Railway deployment
// Only run this server in non-production environments
if (process.env.NODE_ENV !== 'production') {
  const express = require('express');
  const app = express();
  const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

app.get('/', (req, res) => {
  res.status(200).send('Localventure API test server');
});

// Start server - explicitly binding to all interfaces (0.0.0.0) for Railway
const HOST = '0.0.0.0'; // This is critical for Railway to reach your application
  app.listen(PORT, HOST, () => {
    console.log(`Test server running at http://${HOST}:${PORT}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Explicit port binding:', PORT);
  });
} else {
  console.log('Test server disabled in production environment');
}
