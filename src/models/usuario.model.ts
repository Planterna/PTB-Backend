import { Usuario } from '@prisma/client';

export interface IUsuario extends Usuario {}

export interface IUsuarioPublic {
  id: string;
  cedula?: string;
  nombres: string;
  usuario: string;
  email: string;
  fecha_creacion?: Date;
}

export interface RegisterUserDTO {
  cedula: string;
  nombres: string;
  usuario: string;
  email: string;
  password: string;
}

export interface LoginUserDTO {
  usuario: string;
  password: string;
}

/**
 * Validador para el campo usuario:
 * Solo acepta letras (a-z, A-Z), números (0-9), guion bajo (_) y guion medio (-).
 * No permite espacios ni otros caracteres especiales.
 */
export const USUARIO_REGEX = /^[a-zA-Z0-9_-]+$/;

export const isValidUsuario = (usuario: string): boolean => {
  if (!usuario || typeof usuario !== 'string') return false;
  return USUARIO_REGEX.test(usuario);
};
