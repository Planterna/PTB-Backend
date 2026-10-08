import { Response } from 'express';
import { TipoMovimiento } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';

export const getMovimientos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id_usuario = req.user?.id;
    
    if (!id_usuario) {
      res.status(401).json({ error: 'Usuario no autorizado' });
      return;
    }

    const movimientos = await prisma.movimiento.findMany({
      where: { id_usuario },
      orderBy: { fecha_movimiento: 'desc' },
    });

    res.status(200).json(movimientos);
  } catch (error) {
    console.error('Error en getMovimientos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createMovimiento = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id_usuario = req.user?.id;
    const { nombre_movimiento, valor_movimiento, tipo_movimiento } = req.body;

    if (!id_usuario) {
      res.status(401).json({ error: 'Usuario no autorizado' });
      return;
    }

    if (!nombre_movimiento || valor_movimiento === undefined || !tipo_movimiento) {
      res.status(400).json({ error: 'Nombre, valor y tipo de movimiento son obligatorios' });
      return;
    }

    // Validar tipo_movimiento contra el enum TipoMovimiento
    if (!Object.values(TipoMovimiento).includes(tipo_movimiento)) {
       res.status(400).json({ error: 'Tipo de movimiento inválido' });
       return;
    }

    const nuevoMovimiento = await prisma.movimiento.create({
      data: {
        id_usuario,
        nombre_movimiento,
        valor_movimiento: parseFloat(valor_movimiento),
        tipo_movimiento,
      },
    });

    res.status(201).json(nuevoMovimiento);
  } catch (error) {
    console.error('Error en createMovimiento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
