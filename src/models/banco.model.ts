import { Banco, CuentaInterbancaria } from '@prisma/client';

export interface IBanco extends Banco {}

export interface ICuentaInterbancaria extends CuentaInterbancaria {}

export interface ValidarCuentaInterbancariaDTO {
  numero_cuenta: string;
  codigo_banco?: string;
  nombre_banco?: string;
}

export interface VerifiedInterbankAccountData {
  id_cuenta_interbancaria: string;
  numero_cuenta: string;
  tipo_cuenta: string;
  titular: string;
  identificacion: string;
  banco: string;
  codigo_banco: string;
  // Campos espejo para compatibilidad con el ViewModel de Flutter
  accountNumber: string;
  ownerName: string;
  identification: string;
  bankName: string;
  accountType: string;
}

export interface TransferenciaInterbancariaDTO {
  cuenta_origen: string;
  numero_cuenta_destino: string;
  codigo_banco?: string;
  nombre_banco?: string;
  monto: number;
  descripcion?: string;
}

export interface TransferenciaInterbancariaResponse {
  referencia: string;
  tipo_transferencia: 'interbancaria';
  mensaje: string;
  transferencia: {
    cuenta_origen: string;
    cuenta_destino: string;
    banco_destino: string;
    titular_origen: string;
    titular_destino: string;
    monto: number;
    comision?: number;
    total_debitado?: number;
    descripcion?: string | null;
    saldo_restante_origen: number;
    fecha: Date;
  };
}
