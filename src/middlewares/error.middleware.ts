import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.config';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error('Unhandled error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  
  res.status(statusCode).json({
    error: message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
