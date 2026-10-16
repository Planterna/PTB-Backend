import { z } from 'zod';
import { TipoTarjeta } from '@prisma/client';

export const createTarjetaSchema = z.object({
  body: z.object({
    id_cuenta: z.string().uuid('Debe ser un UUID válido'),
    nombre_tarjeta: z.string().min(1, 'El nombre de la tarjeta es obligatorio').max(100),
    tipo_tarjeta: z.nativeEnum(TipoTarjeta, {
      errorMap: () => ({ message: 'Tipo de tarjeta inválido (debe ser debito o credito)' }),
    }),
  }),
});
