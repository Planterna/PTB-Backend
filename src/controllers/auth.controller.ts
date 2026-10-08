import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cedula, nombres, email, password } = req.body;

    if (!cedula || !nombres || !email || !password) {
      res.status(400).json({ error: 'Todos los campos son obligatorios' });
      return;
    }

    // Check if user exists
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

    const newUser = await prisma.usuario.create({
      data: {
        cedula_usuario: cedula,
        nombres_usuario: nombres,
        email_usuario: email,
        password_usuario: hashedPassword,
      },
    });

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: newUser.id_usuario,
        nombres: newUser.nombres_usuario,
        email: newUser.email_usuario,
      },
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
      return;
    }

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
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
