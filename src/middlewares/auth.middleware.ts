import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';

const JWT_SECRET = env.JWT_SECRET;

export interface UserPayload {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        res.status(403).json({ error: 'Token inválido o expirado' });
        return;
      }
      req.user = user as UserPayload;
      next();
    });
  } else {
    res.status(401).json({ error: 'Se requiere token de autorización' });
  }
};
