import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cedula, nombres, usuario, email, password } = req.body;
    const newUser = await authService.register({ cedula, nombres, usuario, email, password });

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: newUser.id_usuario,
        nombres: newUser.nombres_usuario,
        usuario: newUser.usuario,
        email: newUser.email_usuario,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { usuario, password } = req.body;
    const { user, token } = await authService.login({ usuario, password });

    res.status(200).json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id_usuario,
        nombres: user.nombres_usuario,
        usuario: user.usuario,
        email: user.email_usuario,
      },
    });
  } catch (error) {
    next(error);
  }
};
