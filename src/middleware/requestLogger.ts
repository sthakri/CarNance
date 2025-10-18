import pino from 'pino';
import { RequestHandler } from 'express';
import { env } from '../config/env';

export const logger = pino({
  level: env.logLevel,
  transport: { target: 'pino-pretty', options: { colorize: true } }
});

export const requestLogger: RequestHandler = (req, res, next) => {
  const start = process.hrtime.bigint();
  logger.info({ method: req.method, url: req.url }, 'request start');
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    logger.info({ method: req.method, url: req.url, statusCode: res.statusCode, durationMs }, 'request end');
  });
  next();
};


