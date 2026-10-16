import { z } from 'zod';

export const createTarjetaSchema = z.object({
  body: z.object({
    nombre_tarjeta: z.string().min(1, 'El nombre de la tarjeta es obligatorio').max(100),
    numero_tarjeta: z.string().min(1, 'El número de tarjeta es obligatorio').max(20),
    saldo_tarjeta: z.coerce.number().optional().default(0.0),
  }),
});
