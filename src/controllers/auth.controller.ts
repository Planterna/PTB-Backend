import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { env } from '../config/env.config';

const JWT_SECRET = env.JWT_SECRET;

export const register = async (req: Request, res: Response): Promise<void> => {
  const { cedula, nombres, email, password } = req.body;

  const existingUser = await prisma.usuario.findFirst({
    where: {
      OR: [{ email_usuario: email }, { cedula_usuario: cedula }],
    },
  });

  if (existingUser) {
    res.status(400).json({ error: 'El usuario ya existe (correo o cédula duplicada)' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let numero_cuenta = '10' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  while (await prisma.cuenta.findUnique({ where: { numero_cuenta } })) {
    numero_cuenta = '10' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  }

  let numero_tarjeta = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');
  while (await prisma.tarjeta.findUnique({ where: { numero_tarjeta } })) {
    numero_tarjeta = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');
  }

  const newUser = await prisma.usuario.create({
    data: {
      cedula_usuario: cedula,
      nombres_usuario: nombres,
      email_usuario: email,
      password_usuario: hashedPassword,
    },
  });

  const newCuenta = await prisma.cuenta.create({
    data: {
      id_usuario: newUser.id_usuario,
      tipo_cuenta: 'ahorro',
      numero_cuenta,
      saldo_cuenta: 0.0,
    }
  });

  await prisma.tarjeta.create({
    data: {
      id_usuario: newUser.id_usuario,
      id_cuenta: newCuenta.id_cuenta,
      nombre_tarjeta: 'Tarjeta Débito Física',
      numero_tarjeta,
      tipo_tarjeta: 'debito',
    }
  });

  res.status(201).json({
    message: 'Usuario registrado exitosamente',
    user: {
      id: newUser.id_usuario,
      nombres: newUser.nombres_usuario,
      email: newUser.email_usuario,
    },
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await prisma.usuario.findUnique({
    where: { email_usuario: email },
  });

  if (!user) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_usuario);
  if (!isPasswordValid) {
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }

  const token = jwt.sign(
    { id: user.id_usuario, email: user.email_usuario },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.status(200).json({
    message: 'Login exitoso',
    token,
    user: {
      id: user.id_usuario,
      nombres: user.nombres_usuario,
      email: user.email_usuario,
    },
  });
};
