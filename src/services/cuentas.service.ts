import prisma from '../config/prisma';
import {
  CreateCuentaDTO,
  TransferenciaDTO,
  TransferenciaResponse,
  VerifiedAccountData,
} from '../models/cuenta.model';
import {
  TransferenciaInterbancariaDTO,
  TransferenciaInterbancariaResponse,
  VerifiedInterbankAccountData,
} from '../models/banco.model';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../errors/http.error';

export class CuentasService {
  /**
   * Obtiene la lista de todos los bancos registrados en el sistema
   */
  public async getBancos() {
    return await prisma.banco.findMany({
      orderBy: { es_banco_local: 'desc' },
    });
  }

  /**
   * Obtiene todas las cuentas del usuario autenticado
   */
  public async getCuentas(id_usuario?: string) {
    if (!id_usuario) {
      throw new UnauthorizedError('Usuario no autorizado');
    }

    return await prisma.cuenta.findMany({
      where: { id_usuario },
      orderBy: { fecha_creacion: 'desc' },
    });
  }

  /**
   * Crea una nueva cuenta bancaria para el usuario
   */
  public async createCuenta(id_usuario?: string, data?: CreateCuentaDTO) {
    if (!id_usuario) {
      throw new UnauthorizedError('Usuario no autorizado');
    }

    const tipo_cuenta = data?.tipo_cuenta || 'Ahorros';
    const saldo_cuenta = data?.saldo_cuenta !== undefined ? Number(data.saldo_cuenta) : 0.0;

    let numero_cuenta = data?.numero_cuenta;
    if (!numero_cuenta) {
      numero_cuenta = '10' + Math.floor(10000000 + Math.random() * 90000000).toString();
    }

    return await prisma.cuenta.create({
      data: {
        id_usuario,
        tipo_cuenta,
        numero_cuenta,
        saldo_cuenta,
      },
    });
  }

  /**
   * Valida si un número de cuenta interna (Prestige Trust Bank) existe
   */
  public async validarCuenta(numero_cuenta?: string): Promise<VerifiedAccountData> {
    const acc = numero_cuenta?.trim();

    if (!acc || acc.length !== 10) {
      throw new BadRequestError('El número de cuenta debe tener exactamente 10 dígitos');
    }

    const cuenta = await prisma.cuenta.findUnique({
      where: { numero_cuenta: acc },
      include: {
        usuario: true,
      },
    });

    if (!cuenta) {
      throw new NotFoundError('La cuenta ingresada no existe en Prestige Trust Bank');
    }

    return {
      id_cuenta: cuenta.id_cuenta,
      numero_cuenta: cuenta.numero_cuenta,
      tipo_cuenta: cuenta.tipo_cuenta,
      saldo_cuenta: cuenta.saldo_cuenta,
      titular: cuenta.usuario.nombres_usuario,
      identificacion: cuenta.usuario.cedula_usuario,
      banco: 'Prestige Trust Bank',
      // Campos espejo para compatibilidad con la app Flutter
      accountNumber: cuenta.numero_cuenta,
      ownerName: cuenta.usuario.nombres_usuario,
      identification: cuenta.usuario.cedula_usuario,
      bankName: 'Prestige Trust Bank',
      accountType: cuenta.tipo_cuenta,
    };
  }

  /**
   * Valida una cuenta interbancaria en la tabla de simulación de otros bancos
   */
  public async validarCuentaInterbancaria(
    numero_cuenta?: string,
    codigo_o_nombre_banco?: string
  ): Promise<VerifiedInterbankAccountData> {
    const acc = numero_cuenta?.trim();

    if (!acc || acc.length !== 10) {
      throw new BadRequestError('El número de cuenta interbancaria debe tener exactamente 10 dígitos');
    }

    // Buscar la cuenta interbancaria por número
    const cuentaInter = await prisma.cuentaInterbancaria.findUnique({
      where: { numero_cuenta: acc },
      include: { banco: true },
    });

    if (!cuentaInter || !cuentaInter.activa) {
      throw new NotFoundError('La cuenta interbancaria destino no existe o no se encuentra habilitada');
    }

    // Si se especificó banco, verificar coincidencia
    if (codigo_o_nombre_banco) {
      const filtro = codigo_o_nombre_banco.trim().toLowerCase();
      const coincide =
        cuentaInter.banco.codigo_banco.toLowerCase() === filtro ||
        cuentaInter.banco.nombre_banco.toLowerCase().includes(filtro);

      if (!coincide) {
        throw new BadRequestError(
          `La cuenta N° ${acc} pertenece a ${cuentaInter.banco.nombre_banco}, no a ${codigo_o_nombre_banco}`
        );
      }
    }

    return {
      id_cuenta_interbancaria: cuentaInter.id_cuenta_interbancaria,
      numero_cuenta: cuentaInter.numero_cuenta,
      tipo_cuenta: cuentaInter.tipo_cuenta,
      titular: cuentaInter.titular_cuenta,
      identificacion: cuentaInter.cedula_titular,
      banco: cuentaInter.banco.nombre_banco,
      codigo_banco: cuentaInter.banco.codigo_banco,
      accountNumber: cuentaInter.numero_cuenta,
      ownerName: cuentaInter.titular_cuenta,
      identification: cuentaInter.cedula_titular,
      bankName: cuentaInter.banco.nombre_banco,
      accountType: cuentaInter.tipo_cuenta,
    };
  }

  /**
   * Ejecuta transferencia interna (mismo banco)
   */
  public async realizarTransferencia(
    id_usuario: string,
    data: TransferenciaDTO
  ): Promise<TransferenciaResponse> {
    if (!id_usuario) {
      throw new UnauthorizedError('Usuario no autorizado');
    }

    const cuentaOrigenNum = (data.cuenta_origen || data.numero_cuenta_origen)?.trim();
    const cuentaDestinoNum = (data.cuenta_destino || data.numero_cuenta_destino)?.trim();
    const monto = Number(data.monto);
    const detalle = data.descripcion || data.detalle || data.motivo || null;

    if (!cuentaOrigenNum || !cuentaDestinoNum) {
      throw new BadRequestError('El número de cuenta de origen y de destino son obligatorios');
    }

    if (isNaN(monto) || monto <= 0) {
      throw new BadRequestError('El monto a transferir debe ser un número válido mayor a $0.00');
    }

    if (cuentaOrigenNum === cuentaDestinoNum) {
      throw new BadRequestError('La cuenta de destino no puede ser la misma cuenta de origen');
    }

    const cuentaOrigen = await prisma.cuenta.findUnique({
      where: { numero_cuenta: cuentaOrigenNum },
      include: { usuario: true },
    });

    if (!cuentaOrigen) {
      throw new NotFoundError(`La cuenta de origen N° ${cuentaOrigenNum} no existe`);
    }

    if (cuentaOrigen.id_usuario !== id_usuario) {
      throw new ForbiddenError('La cuenta de origen no pertenece al usuario autenticado');
    }

    if (cuentaOrigen.saldo_cuenta < monto) {
      throw new BadRequestError(
        `Saldo insuficiente. Saldo disponible: $${cuentaOrigen.saldo_cuenta.toFixed(2)}, Monto a debitar: $${monto.toFixed(2)}`
      );
    }

    const cuentaDestino = await prisma.cuenta.findUnique({
      where: { numero_cuenta: cuentaDestinoNum },
      include: { usuario: true },
    });

    if (!cuentaDestino) {
      throw new NotFoundError(`La cuenta de destino N° ${cuentaDestinoNum} no existe`);
    }

    // Obtener id de tipo de movimiento 'transfer'
    let tipoTransfer = await prisma.tipoMovimiento.findUnique({
      where: { codigo: 'transfer' },
    });

    if (!tipoTransfer) {
      tipoTransfer = await prisma.tipoMovimiento.create({
        data: {
          codigo: 'transfer',
          nombre: 'Transferencia',
        },
      });
    }

    const referencia = `PTB-${Date.now().toString().slice(-7)}`;

    const [cuentaOrigenActualizada] = await prisma.$transaction([
      prisma.cuenta.update({
        where: { id_cuenta: cuentaOrigen.id_cuenta },
        data: {
          saldo_cuenta: { decrement: monto },
        },
      }),
      prisma.cuenta.update({
        where: { id_cuenta: cuentaDestino.id_cuenta },
        data: {
          saldo_cuenta: { increment: monto },
        },
      }),
      prisma.movimiento.create({
        data: {
          id_usuario: cuentaOrigen.id_usuario,
          id_tipo_movimiento: tipoTransfer.id_tipo_movimiento,
          nombre_movimiento: `Transferencia a ${cuentaDestino.usuario.nombres_usuario}`,
          descripcion: detalle,
          valor_movimiento: -monto,
        },
      }),
      prisma.movimiento.create({
        data: {
          id_usuario: cuentaDestino.id_usuario,
          id_tipo_movimiento: tipoTransfer.id_tipo_movimiento,
          nombre_movimiento: `Transferencia de ${cuentaOrigen.usuario.nombres_usuario}`,
          descripcion: detalle,
          valor_movimiento: monto,
        },
      }),
    ]);

    return {
      referencia,
      mensaje: 'Transferencia realizada exitosamente',
      transferencia: {
        cuenta_origen: cuentaOrigen.numero_cuenta,
        cuenta_destino: cuentaDestino.numero_cuenta,
        titular_origen: cuentaOrigen.usuario.nombres_usuario,
        titular_destino: cuentaDestino.usuario.nombres_usuario,
        monto,
        descripcion: detalle,
        saldo_restante_origen: cuentaOrigenActualizada.saldo_cuenta,
        fecha: new Date(),
      },
    };
  }

  /**
   * Ejecuta transferencia interbancaria (hacia cuenta de otro banco)
   */
  public async realizarTransferenciaInterbancaria(
    id_usuario: string,
    data: TransferenciaInterbancariaDTO
  ): Promise<TransferenciaInterbancariaResponse> {
    if (!id_usuario) {
      throw new UnauthorizedError('Usuario no autorizado');
    }

    const cuentaOrigenNum = data.cuenta_origen?.trim();
    const cuentaDestinoNum = data.numero_cuenta_destino?.trim();
    const monto = Number(data.monto);
    const detalle = data.descripcion || null;

    if (!cuentaOrigenNum || !cuentaDestinoNum) {
      throw new BadRequestError('El número de cuenta de origen y la cuenta interbancaria de destino son obligatorios');
    }

    if (isNaN(monto) || monto <= 0) {
      throw new BadRequestError('El monto a transferir debe ser un número válido mayor a $0.00');
    }

    // 1. Validar cuenta origen en Prestige Trust Bank
    const cuentaOrigen = await prisma.cuenta.findUnique({
      where: { numero_cuenta: cuentaOrigenNum },
      include: { usuario: true },
    });

    if (!cuentaOrigen) {
      throw new NotFoundError(`La cuenta de origen N° ${cuentaOrigenNum} no existe`);
    }

    if (cuentaOrigen.id_usuario !== id_usuario) {
      throw new ForbiddenError('La cuenta de origen no pertenece al usuario autenticado');
    }

    if (cuentaOrigen.saldo_cuenta < monto) {
      throw new BadRequestError(
        `Saldo insuficiente. Saldo disponible: $${cuentaOrigen.saldo_cuenta.toFixed(2)}, Monto a debitar: $${monto.toFixed(2)}`
      );
    }

    // 2. Validar cuenta destino en la tabla CuentaInterbancaria
    const cuentaDestino = await prisma.cuentaInterbancaria.findUnique({
      where: { numero_cuenta: cuentaDestinoNum },
      include: { banco: true },
    });

    if (!cuentaDestino || !cuentaDestino.activa) {
      throw new NotFoundError('La cuenta interbancaria destino no existe o no se encuentra habilitada');
    }

    // 3. Obtener id de tipo de movimiento 'transfer'
    let tipoTransfer = await prisma.tipoMovimiento.findUnique({
      where: { codigo: 'transfer' },
    });

    if (!tipoTransfer) {
      tipoTransfer = await prisma.tipoMovimiento.create({
        data: {
          codigo: 'transfer',
          nombre: 'Transferencia',
        },
      });
    }

    const referencia = `PTB-INTER-${Date.now().toString().slice(-7)}`;

    // 4. Ejecutar transacción atómica: debitar origen y acreditar en simulación interbancaria
    const [cuentaOrigenActualizada] = await prisma.$transaction([
      // a) Debitar saldo de la cuenta origen en nuestro banco
      prisma.cuenta.update({
        where: { id_cuenta: cuentaOrigen.id_cuenta },
        data: {
          saldo_cuenta: { decrement: monto },
        },
      }),

      // b) Acreditar en la cuenta interbancaria destino (simulación)
      prisma.cuentaInterbancaria.update({
        where: { id_cuenta_interbancaria: cuentaDestino.id_cuenta_interbancaria },
        data: {
          saldo_cuenta: { increment: monto },
        },
      }),

      // c) Crear movimiento de débito para el usuario emisor
      prisma.movimiento.create({
        data: {
          id_usuario: cuentaOrigen.id_usuario,
          id_tipo_movimiento: tipoTransfer.id_tipo_movimiento,
          nombre_movimiento: `Transferencia interbancaria a ${cuentaDestino.titular_cuenta} (${cuentaDestino.banco.nombre_banco})`,
          descripcion: detalle,
          valor_movimiento: -monto,
        },
      }),
    ]);

    return {
      referencia,
      tipo_transferencia: 'interbancaria',
      mensaje: 'Transferencia interbancaria realizada exitosamente',
      transferencia: {
        cuenta_origen: cuentaOrigen.numero_cuenta,
        cuenta_destino: cuentaDestino.numero_cuenta,
        banco_destino: cuentaDestino.banco.nombre_banco,
        titular_origen: cuentaOrigen.usuario.nombres_usuario,
        titular_destino: cuentaDestino.titular_cuenta,
        monto,
        descripcion: detalle,
        saldo_restante_origen: cuentaOrigenActualizada.saldo_cuenta,
        fecha: new Date(),
      },
    };
  }
}

export const cuentasService = new CuentasService();
