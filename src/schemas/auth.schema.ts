import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    cedula: z.string().min(1, 'La cédula es obligatoria').max(10, 'La cédula no puede tener más de 10 caracteres'),
    nombres: z.string().min(1, 'Los nombres son obligatorios').max(255),
    usuario: z.string().min(1, 'El nombre de usuario es obligatorio').max(100),
    email: z.string().email('Debe ser un correo electrónico válido').max(255),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(255),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    usuario: z.string().optional(),
    email: z.string().optional(),
    password: z.string().min(1, 'La contraseña es obligatoria'),
  }).refine((data) => (data.usuario && data.usuario.trim().length > 0) || (data.email && data.email.trim().length > 0), {
    message: 'El nombre de usuario o correo electrónico es obligatorio',
    path: ['usuario'],
  }),
});
