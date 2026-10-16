import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { tarjetasService } from '../services/tarjetas.service';

export const getTarjetas = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id_usuario = req.user?.id;
    const tarjetas = await tarjetasService.getTarjetas(id_usuario);
    res.status(200).json(tarjetas);
  } catch (error) {
    next(error);
  }
};

export const createTarjeta = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id_usuario = req.user?.id;
    const nuevaTarjeta = await tarjetasService.createTarjeta(id_usuario, req.body);
    res.status(201).json(nuevaTarjeta);
  } catch (error) {
    next(error);
  }
};
