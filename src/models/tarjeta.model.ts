import { Tarjeta } from '@prisma/client';

export interface ITarjeta extends Tarjeta {}

export interface CreateTarjetaDTO {
  nombre_tarjeta: string;
  numero_tarjeta: string;
  saldo_tarjeta?: number;
}
