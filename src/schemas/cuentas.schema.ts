import { z } from 'zod';

export const createCuentaSchema = z.object({
  body: z.object({
    tipo_cuenta: z.string().min(1, 'El tipo de cuenta es obligatorio'),
    saldo_cuenta: z.coerce.number().optional().default(0.0),
    numero_cuenta: z.string().optional(),
  }),
});
