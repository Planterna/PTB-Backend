import { z } from 'zod';

export const createMovimientoSchema = z.object({
  body: z.object({
    nombre_movimiento: z.string().min(1, 'El nombre del movimiento es obligatorio').max(255),
    descripcion: z.string().optional().nullable(),
    valor_movimiento: z.coerce.number({
      invalid_type_error: 'El valor del movimiento debe ser un número',
    }),
    tipo_movimiento: z.string().min(1, 'El tipo de movimiento es obligatorio'),
  }),
});
