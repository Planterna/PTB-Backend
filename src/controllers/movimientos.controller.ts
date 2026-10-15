import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { movimientosService } from '../services/movimientos.service';

export const getMovimientos = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id_usuario = req.user?.id;
    const movimientos = await movimientosService.getMovimientos(id_usuario);
    res.status(200).json(movimientos);
  } catch (error) {
    next(error);
  }
};

export const createMovimiento = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id_usuario = req.user?.id;
    const nuevoMovimiento = await movimientosService.createMovimiento(id_usuario, req.body);
    res.status(201).json(nuevoMovimiento);
  } catch (error) {
    next(error);
  }
};
