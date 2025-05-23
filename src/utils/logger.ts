import pino from 'pino';

// Simple logger configuration that works in all environments
export const logger = pino({
  base: {pid: false},
  timestamp: () => `"time":"${new Date().toISOString()}"`
});
