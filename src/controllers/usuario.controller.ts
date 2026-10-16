import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { usuarioService } from '../services/usuario.service';

export const getPerfil = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id_usuario = req.user?.id;
    const user = await usuarioService.getPerfil(id_usuario);

    res.status(200).json({
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePerfil = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id_usuario = req.user?.id;
    const { nombres, email } = req.body;
    const updatedUser = await usuarioService.updatePerfil(id_usuario, { nombres, email });

    res.status(200).json({
      message: 'Perfil actualizado exitosamente',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
