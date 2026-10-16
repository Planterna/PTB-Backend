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
        cedula: newUser.cedula_usuario,
        cedula_usuario: newUser.cedula_usuario,
        nombres: newUser.nombres_usuario,
        usuario: newUser.usuario,
        email: newUser.email_usuario,
      },
    });
  } catch (error) {
    next(error);
  }

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { usuario, password } = req.body;
    const { user, token } = await authService.login({ usuario, password });

    res.status(200).json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id_usuario,
        cedula: user.cedula_usuario,
        cedula_usuario: user.cedula_usuario,
        nombres: user.nombres_usuario,
        usuario: user.usuario,
        email: user.email_usuario,
      },
    });
  } catch (error) {
    next(error);
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
      cedula: user.cedula_usuario,
      nombres: user.nombres_usuario,
      email: user.email_usuario,
    },
  });
};
