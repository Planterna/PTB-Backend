import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getTarjetas = async (req: Request, res: Response): Promise<void> => {
  const id_usuario = req.user!.id;

  const tarjetas = await prisma.tarjeta.findMany({
    where: { id_usuario },
    orderBy: { fecha_creacion: 'desc' },
  });

  res.status(200).json(tarjetas);
};

export const createTarjeta = async (req: Request, res: Response): Promise<void> => {
  const id_usuario = req.user!.id;
  const { id_cuenta, nombre_tarjeta, tipo_tarjeta } = req.body;

  const cuenta = await prisma.cuenta.findFirst({
    where: { id_cuenta, id_usuario }
  });

  if (!cuenta) {
    res.status(404).json({ error: 'La cuenta no existe o no pertenece al usuario' });
    return;
  }

  if (tipo_tarjeta === 'credito') {
    const cantidadTarjetasCredito = await prisma.tarjeta.count({
      where: {
        id_usuario,
        tipo_tarjeta: 'credito'
      }
    });

    if (cantidadTarjetasCredito >= 5) {
      res.status(400).json({ error: 'Has alcanzado el límite máximo de 5 tarjetas de crédito' });
      return;
    }
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
