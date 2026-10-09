import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getCuentas = async (req: Request, res: Response): Promise<void> => {
  const id_usuario = req.user!.id; // Ya garantizado por auth.middleware

  const cuentas = await prisma.cuenta.findMany({
    where: { id_usuario },
    orderBy: { fecha_creacion: 'desc' },
    include: { movimientos: true }
  });

  res.status(200).json(cuentas);
};

export const createCuenta = async (req: Request, res: Response): Promise<void> => {
  const id_usuario = req.user!.id;
  const { tipo_cuenta, saldo_cuenta } = req.body;

  if (tipo_cuenta === 'corriente') {
    const existingCorriente = await prisma.cuenta.findFirst({
      where: {
        id_usuario,
        tipo_cuenta: 'corriente'
      }
    });

    if (existingCorriente) {
      res.status(400).json({ error: 'Ya tienes una cuenta corriente creada. Solo se permite una por usuario.' });
      return;
    }
  }

  // Generar número de cuenta aleatorio de 10 dígitos empezando en 10
  let random8 = Math.floor(10000000 + Math.random() * 90000000).toString();
  let numero_cuenta = `10${random8}`;

  let existingCuenta = await prisma.cuenta.findUnique({
    where: { numero_cuenta }
  });

  while (existingCuenta) {
    random8 = Math.floor(10000000 + Math.random() * 90000000).toString();
    numero_cuenta = `10${random8}`;
    existingCuenta = await prisma.cuenta.findUnique({
      where: { numero_cuenta }
    });
  }

  const nuevaCuenta = await prisma.cuenta.create({
    data: {
      id_usuario,
      tipo_cuenta,
      numero_cuenta,
      saldo_cuenta,
    },
  });

  res.status(201).json(nuevaCuenta);
};
