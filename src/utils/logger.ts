import pino from 'pino';

export const logger = pino({
  transport: {target: 'pino-pretty', options: {colorize: true}},
  base: {pid: false},
  timestamp: () => `"time":"${new Date().toISOString()}"`
});
