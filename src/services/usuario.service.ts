import prisma from '../config/prisma';
import { NotFoundError, BadRequestError, ConflictError } from '../errors/http.error';

export interface UpdatePerfilDTO {
  nombres?: string;
  email?: string;
}

export class UsuarioService {
  /**
   * Obtiene el perfil del usuario autenticado por su ID
   */
  public async getPerfil(id_usuario: string) {
    if (!id_usuario) {
      throw new BadRequestError('ID de usuario requerido');
    }

    const user = await prisma.usuario.findUnique({
      where: { id_usuario },
    });

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    return {
      id: user.id_usuario,
      cedula: user.cedula_usuario,
      cedula_usuario: user.cedula_usuario,
      nombres: user.nombres_usuario,
      usuario: user.usuario,
      email: user.email_usuario,
      fecha_creacion: user.fecha_creacion,
    };
  }

  /**
   * Actualiza datos básicos del perfil (nombres, email)
   */
  public async updatePerfil(id_usuario: string, data: UpdatePerfilDTO) {
    if (!id_usuario) {
      throw new BadRequestError('ID de usuario requerido');
    }

    const { nombres, email } = data;

    const user = await prisma.usuario.findUnique({
      where: { id_usuario },
    });

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Si actualiza email, verificar que no esté ocupado por otro usuario
    if (email && email.toLowerCase() !== user.email_usuario.toLowerCase()) {
      const existingEmail = await prisma.usuario.findFirst({
        where: {
          email_usuario: { equals: email.trim(), mode: 'insensitive' },
          NOT: { id_usuario },
        },
      });

      if (existingEmail) {
        throw new ConflictError('El correo electrónico ya está en uso por otra cuenta');
      }
    }

    const updatedUser = await prisma.usuario.update({
      where: { id_usuario },
      data: {
        ...(nombres ? { nombres_usuario: nombres.trim() } : {}),
        ...(email ? { email_usuario: email.trim() } : {}),
      },
    });

    return {
      id: updatedUser.id_usuario,
      cedula: updatedUser.cedula_usuario,
      cedula_usuario: updatedUser.cedula_usuario,
      nombres: updatedUser.nombres_usuario,
      usuario: updatedUser.usuario,
      email: updatedUser.email_usuario,
      fecha_actualizacion: updatedUser.fecha_actualizacion,
    };
  }
}

export const usuarioService = new UsuarioService();
