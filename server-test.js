// Minimal Express server for testing Railway deployment
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
});
