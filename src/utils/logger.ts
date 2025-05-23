import pino from 'pino';

// Create different logger configurations for development and production
const isDevelopment = process.env.NODE_ENV !== 'production';

// Base logger config
const baseConfig = {
  base: {pid: false},
  timestamp: () => `"time":"${new Date().toISOString()}"`
};

// Only use pino-pretty in development
export const logger = isDevelopment
  ? pino({
      ...baseConfig,
      transport: {target: 'pino-pretty', options: {colorize: true}}
    })
  : pino(baseConfig);
