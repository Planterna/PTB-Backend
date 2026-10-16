import { Movimiento, TipoMovimiento } from '@prisma/client';

export interface IMovimiento extends Movimiento {}
export interface ITipoMovimiento extends TipoMovimiento {}

export interface CreateMovimientoDTO {
  nombre_movimiento: string;
  descripcion?: string | null;
  valor_movimiento: number;
  tipo_movimiento: string; // 'transfer', 'purchase', 'subscription', 'deposit'
}
