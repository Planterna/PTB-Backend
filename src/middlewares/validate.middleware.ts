import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsedData = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      if (parsedData.body) req.body = parsedData.body;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Error de validación',
          details: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};
