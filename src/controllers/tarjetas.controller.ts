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

  // Generar numero de tarjeta de 16 digitos, Visa empieza con 4
  const random12 = Math.floor(100000000000 + Math.random() * 900000000000).toString();
  const numero_tarjeta = `4000${random12}`;

  const nuevaTarjeta = await prisma.tarjeta.create({
    data: {
      id_usuario,
      id_cuenta,
      nombre_tarjeta,
      numero_tarjeta,
      tipo_tarjeta,
    },
  });

  res.status(201).json(nuevaTarjeta);
};
