import { NextFunction, Request, Response } from 'express';

type AppError = Error & { status?: number };

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status && Number.isInteger(err.status) ? err.status : 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ data: null, error: { message, status } });
}


