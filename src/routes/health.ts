import express from 'express';

const router = express.Router();

// Super simple health check endpoint that always returns 200 OK
router.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

router.get('/', (_req, res) => {
  res.status(200).send('Localventure API is running');
});

export const healthRoutes = router;
