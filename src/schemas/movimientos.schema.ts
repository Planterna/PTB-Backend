import { z } from 'zod';
import { TipoMovimiento } from '@prisma/client';

export const createMovimientoSchema = z.object({
  body: z.object({
    id_cuenta: z.string().uuid('Debe ser un UUID válido'),
    nombre_movimiento: z.string().min(1, 'El nombre del movimiento es obligatorio').max(255),
    valor_movimiento: z.coerce.number({
      invalid_type_error: "El valor del movimiento debe ser un número",
    }),
    tipo_movimiento: z.nativeEnum(TipoMovimiento, {
      errorMap: () => ({ message: 'Tipo de movimiento inválido' }),
    }),
  }),
});
