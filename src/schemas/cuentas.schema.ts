import { z } from 'zod';
import { TipoCuenta } from '@prisma/client';

export const createCuentaSchema = z.object({
  body: z.object({
    tipo_cuenta: z.nativeEnum(TipoCuenta, {
      errorMap: () => ({ message: 'Tipo de cuenta inválido (debe ser ahorro o corriente)' }),
    }),
    saldo_cuenta: z.coerce.number().optional().default(0.0),
  }),
});
