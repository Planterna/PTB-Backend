import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getMovimientos = async (req: Request, res: Response): Promise<void> => {
  const id_usuario = req.user!.id;

  const movimientos = await prisma.movimiento.findMany({
    where: { id_usuario },
    orderBy: { fecha_movimiento: 'desc' },
  });

  res.status(200).json(movimientos);
};

export const createMovimiento = async (req: Request, res: Response): Promise<void> => {
  const id_usuario = req.user!.id;
  const { id_cuenta, nombre_movimiento, valor_movimiento, tipo_movimiento } = req.body;

  const cuenta = await prisma.cuenta.findFirst({
    where: { id_cuenta, id_usuario }
  });

  if (!cuenta) {
    res.status(404).json({ error: 'La cuenta no existe o no pertenece al usuario' });
    return;
  }

  let ajusteSaldo = valor_movimiento;
  if (['purchase', 'subscription', 'transfer'].includes(tipo_movimiento)) {
    ajusteSaldo = -Math.abs(valor_movimiento);
  } else if (tipo_movimiento === 'deposit') {
    ajusteSaldo = Math.abs(valor_movimiento);
  }

  const [nuevoMovimiento, cuentaActualizada] = await prisma.$transaction([
    prisma.movimiento.create({
      data: {
        id_usuario,
        id_cuenta,
        nombre_movimiento,
        valor_movimiento,
        tipo_movimiento,
      },
    }),
    prisma.cuenta.update({
      where: { id_cuenta },
      data: {
        saldo_cuenta: {
          increment: ajusteSaldo
        }
      }
    })
  ]);

  res.status(201).json(nuevoMovimiento);
};
