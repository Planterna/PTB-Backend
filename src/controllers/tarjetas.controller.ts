import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';

export const getTarjetas = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id_usuario = req.user?.id;
    
    if (!id_usuario) {
      res.status(401).json({ error: 'Usuario no autorizado' });
      return;
    }

    const tarjetas = await prisma.tarjeta.findMany({
      where: { id_usuario },
      orderBy: { fecha_creacion: 'desc' },
    });

    res.status(200).json(tarjetas);
  } catch (error) {
    console.error('Error en getTarjetas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createTarjeta = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id_usuario = req.user?.id;
    const { nombre_tarjeta, numero_tarjeta, saldo_tarjeta } = req.body;

    if (!id_usuario) {
      res.status(401).json({ error: 'Usuario no autorizado' });
      return;
    }

    if (!nombre_tarjeta || !numero_tarjeta) {
      res.status(400).json({ error: 'Nombre y número de tarjeta son obligatorios' });
      return;
    }

    const nuevaTarjeta = await prisma.tarjeta.create({
      data: {
        id_usuario,
        nombre_tarjeta,
        numero_tarjeta,
        saldo_tarjeta: saldo_tarjeta || 0.0,
      },
    });

    res.status(201).json(nuevaTarjeta);
  } catch (error) {
    console.error('Error en createTarjeta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
