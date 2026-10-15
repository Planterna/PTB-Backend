import { Cuenta } from '@prisma/client';

export interface ICuenta extends Cuenta {}

export interface CreateCuentaDTO {
  tipo_cuenta: string; // 'Ahorro' | 'Corriente'
  numero_cuenta?: string;
  saldo_cuenta?: number;
}

export interface ValidarCuentaDTO {
  numero_cuenta: string;
}

export interface VerifiedAccountData {
  id_cuenta: string;
  numero_cuenta: string;
  tipo_cuenta: string;
  saldo_cuenta?: number;
  titular: string;
  identificacion: string;
  banco: string;
  // Campos espejo para compatibilidad con la app Flutter
  accountNumber: string;
  ownerName: string;
  identification: string;
  bankName: string;
  accountType: string;
}

export interface TransferenciaDTO {
  cuenta_origen?: string;
  numero_cuenta_origen?: string;
  cuenta_destino?: string;
  numero_cuenta_destino?: string;
  monto: number;
  descripcion?: string;
  detalle?: string;
  motivo?: string;
}

export interface TransferenciaResponse {
  referencia: string;
  mensaje: string;
  transferencia: {
    cuenta_origen: string;
    cuenta_destino: string;
    titular_origen: string;
    titular_destino: string;
    monto: number;
    descripcion?: string | null;
    saldo_restante_origen: number;
    fecha: Date;
  };
}
