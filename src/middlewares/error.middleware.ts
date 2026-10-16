import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../errors/http.error';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
};
