import prisma from '../config/prisma';
import {
  CreateCuentaDTO,
  CrearCuentaCorrienteDTO,
  SolicitudCuentaCorrienteResponse,
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
   * Obtiene todas las cuentas del usuario autenticado (garantizando al menos una de ahorros)
   */
  public async getCuentas(id_usuario?: string) {
    if (!id_usuario) {
      throw new UnauthorizedError('Usuario no autorizado');
    }

    let cuentas = await prisma.cuenta.findMany({
      where: { id_usuario },
      orderBy: { fecha_creacion: 'desc' },
    });

    // Garantizar que todo usuario tenga al menos una cuenta de ahorros
    const hasSavings = cuentas.some((c) => c.tipo_cuenta.toLowerCase().startsWith('ahorro'));
    if (!hasSavings) {
      const defaultAccountNumber = '10' + Math.floor(10000000 + Math.random() * 90000000).toString();
      const defaultAccount = await prisma.cuenta.create({
        data: {
          id_usuario,
          tipo_cuenta: 'ahorro',
          numero_cuenta: defaultAccountNumber,
          saldo_cuenta: 0.0,
        },
      });
      cuentas.unshift(defaultAccount);
    }

    return cuentas;
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

    if (!acc || !/^\d{10}$/.test(acc)) {
      throw new BadRequestError('El número de cuenta debe tener exactamente 10 dígitos numéricos');
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

    if (!acc || !/^\d{10}$/.test(acc)) {
      throw new BadRequestError('El número de cuenta interbancaria debe tener exactamente 10 dígitos numéricos');
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
        cuentaInter.banco.nombre_banco.toLowerCase().includes(filtro) ||
        filtro.includes(cuentaInter.banco.codigo_banco.toLowerCase()) ||
        filtro.includes(cuentaInter.banco.nombre_banco.toLowerCase());

      if (!coincide) {
        throw new BadRequestError(
          `La cuenta N° ${acc} es invalida`
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

    if (!/^\d{10}$/.test(cuentaOrigenNum)) {
      throw new BadRequestError('El número de cuenta de origen debe tener exactamente 10 dígitos numéricos');
    }

    if (!/^\d{10}$/.test(cuentaDestinoNum)) {
      throw new BadRequestError('El número de cuenta de destino debe tener exactamente 10 dígitos numéricos');
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

    const cuentaOrigenNum = (data.cuenta_origen || (data as any).numero_cuenta_origen)?.trim();
    const cuentaDestinoNum = (data.numero_cuenta_destino || (data as any).cuenta_destino)?.trim();
    const monto = Number(data.monto);
    const detalle = data.descripcion || (data as any).detalle || (data as any).motivo || null;

    if (!cuentaOrigenNum || !cuentaDestinoNum) {
      throw new BadRequestError('El número de cuenta de origen y la cuenta interbancaria de destino son obligatorios');
    }

    if (!/^\d{10}$/.test(cuentaOrigenNum)) {
      throw new BadRequestError('El número de cuenta de origen debe tener exactamente 10 dígitos numéricos');
    }

    if (!/^\d{10}$/.test(cuentaDestinoNum)) {
      throw new BadRequestError('El número de cuenta interbancaria de destino debe tener exactamente 10 dígitos numéricos');
    }

    if (cuentaOrigenNum === cuentaDestinoNum) {
      throw new BadRequestError('La cuenta de destino no puede ser la misma cuenta de origen');
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

    const comision = 0.45;
    const montoTotalDebitar = Number((monto + comision).toFixed(2));

    if (cuentaOrigen.saldo_cuenta < montoTotalDebitar) {
      throw new BadRequestError(
        `Saldo insuficiente. Saldo disponible: $${cuentaOrigen.saldo_cuenta.toFixed(2)}, Monto requerido ($${monto.toFixed(2)} + comisión interbancaria $${comision.toFixed(2)}): $${montoTotalDebitar.toFixed(2)}`
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

    // Si se especificó banco destino, verificar que coincida
    const bancoInput = (data.nombre_banco || data.codigo_banco || (data as any).banco)?.trim().toLowerCase();
    if (bancoInput) {
      const coincide =
        cuentaDestino.banco.codigo_banco.toLowerCase() === bancoInput ||
        cuentaDestino.banco.nombre_banco.toLowerCase().includes(bancoInput) ||
        bancoInput.includes(cuentaDestino.banco.codigo_banco.toLowerCase()) ||
        bancoInput.includes(cuentaDestino.banco.nombre_banco.toLowerCase());

      if (!coincide) {
        throw new BadRequestError(
          `La cuenta N° ${cuentaDestinoNum} pertenece a ${cuentaDestino.banco.nombre_banco}, no a ${data.nombre_banco || data.codigo_banco || (data as any).banco}`
        );
      }
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

    // 4. Ejecutar transacción atómica: debitar origen (monto + comisión) y acreditar en simulación interbancaria
    const [cuentaOrigenActualizada] = await prisma.$transaction([
      // a) Debitar saldo total de la cuenta origen en nuestro banco
      prisma.cuenta.update({
        where: { id_cuenta: cuentaOrigen.id_cuenta },
        data: {
          saldo_cuenta: { decrement: montoTotalDebitar },
        },
      }),

      // b) Acreditar en la cuenta interbancaria destino (simulación)
      prisma.cuentaInterbancaria.update({
        where: { id_cuenta_interbancaria: cuentaDestino.id_cuenta_interbancaria },
        data: {
          saldo_cuenta: { increment: monto },
        },
      }),

      // c) Crear movimiento de débito para el usuario emisor por la transferencia
      prisma.movimiento.create({
        data: {
          id_usuario: cuentaOrigen.id_usuario,
          id_tipo_movimiento: tipoTransfer.id_tipo_movimiento,
          nombre_movimiento: `Transferencia interbancaria a ${cuentaDestino.titular_cuenta} (${cuentaDestino.banco.nombre_banco})`,
          descripcion: detalle,
          valor_movimiento: -monto,
        },
      }),

      // d) Crear movimiento de débito para la comisión interbancaria
      prisma.movimiento.create({
        data: {
          id_usuario: cuentaOrigen.id_usuario,
          id_tipo_movimiento: tipoTransfer.id_tipo_movimiento,
          nombre_movimiento: 'Comisión transferencia interbancaria',
          descripcion: `Comisión interbancaria a ${cuentaDestino.banco.nombre_banco} (Ref: ${referencia})`,
          valor_movimiento: -comision,
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
        comision,
        total_debitado: montoTotalDebitar,
        descripcion: detalle,
        saldo_restante_origen: cuentaOrigenActualizada.saldo_cuenta,
        fecha: new Date(),
      },
    };
  }

  /**
   * Crea una nueva cuenta corriente mediante solicitud con débito o pago en ventanilla
   */
  public async crearCuentaCorriente(
    id_usuario: string,
    data: CrearCuentaCorrienteDTO
  ): Promise<SolicitudCuentaCorrienteResponse> {
    if (!id_usuario) {
      throw new UnauthorizedError('Usuario no autorizado');
    }

    const {
      tiene_residencia_usa,
      declara_impuestos_otro_pais,
      modelo_chequera,
      numero_cheques,
      tipo_chequera,
      nombre_en_documentos,
      agencia_retiro,
      metodo_pago,
      id_cuenta_origen,
      numero_cuenta_origen,
    } = data;

    if (!modelo_chequera || !agencia_retiro || !metodo_pago) {
      throw new BadRequestError('El modelo de chequera, agencia de retiro y método de pago son obligatorios');
    }

    if (metodo_pago !== 'DEBITO_AHORROS' && metodo_pago !== 'PAGO_VENTANILLA') {
      throw new BadRequestError("El método de pago debe ser 'DEBITO_AHORROS' o 'PAGO_VENTANILLA'");
    }

    const user = await prisma.usuario.findUnique({
      where: { id_usuario },
    });

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    const docName = nombre_en_documentos?.trim() || user.nombres_usuario;

    // OPCIÓN 2: PAGO EN VENTANILLA
    if (metodo_pago === 'PAGO_VENTANILLA') {
      const solicitud = await prisma.solicitudCuentaCorriente.create({
        data: {
          id_usuario,
          tiene_residencia_usa: Boolean(tiene_residencia_usa),
          declara_impuestos_otro_pais: Boolean(declara_impuestos_otro_pais),
          modelo_chequera: modelo_chequera.trim(),
          numero_cheques: Number(numero_cheques) || 20,
          tipo_chequera: tipo_chequera?.trim() || 'Con talón',
          nombre_en_documentos: docName,
          agencia_retiro: agencia_retiro.trim(),
          metodo_pago: 'PAGO_VENTANILLA',
          monto_apertura: 350.0,
          estado: 'PENDIENTE_VENTANILLA',
        },
      });

      return {
        exito: true,
        metodo_pago: 'PAGO_VENTANILLA',
        estado: 'PENDIENTE_VENTANILLA',
        mensaje:
          'Solicitud registrada. Para que el proceso continúe y tu cuenta corriente sea activada, debes acercarte a un establecimiento físico o agencia de Prestige Trust Bank para realizar el depósito de apertura de $350.00.',
        solicitud: {
          id_solicitud: solicitud.id_solicitud,
          tiene_residencia_usa: solicitud.tiene_residencia_usa,
          declara_impuestos_otro_pais: solicitud.declara_impuestos_otro_pais,
          modelo_chequera: solicitud.modelo_chequera,
          numero_cheques: solicitud.numero_cheques,
          tipo_chequera: solicitud.tipo_chequera,
          nombre_en_documentos: solicitud.nombre_en_documentos,
          agencia_retiro: solicitud.agencia_retiro,
          metodo_pago: solicitud.metodo_pago,
          monto_apertura: solicitud.monto_apertura,
          estado: solicitud.estado,
          fecha_creacion: solicitud.fecha_creacion,
        },
      };
    }

    // OPCIÓN 1: TRANSFERIR DE CUENTA DE AHORROS
    let cuentaAhorro;
    if (id_cuenta_origen) {
      cuentaAhorro = await prisma.cuenta.findFirst({
        where: { id_cuenta: id_cuenta_origen, id_usuario },
      });
    } else if (numero_cuenta_origen) {
      cuentaAhorro = await prisma.cuenta.findFirst({
        where: { numero_cuenta: numero_cuenta_origen.trim(), id_usuario },
      });
    } else {
      cuentaAhorro = await prisma.cuenta.findFirst({
        where: {
          id_usuario,
          tipo_cuenta: { contains: 'ahorro', mode: 'insensitive' },
        },
        orderBy: { saldo_cuenta: 'desc' },
      });
    }

    if (!cuentaAhorro) {
      throw new BadRequestError('No se encontró una cuenta de ahorros activa del usuario para debitar los $350.00.');
    }

    if (cuentaAhorro.saldo_cuenta < 350.0) {
      throw new BadRequestError(
        `Saldo insuficiente en tu cuenta de ahorro (${cuentaAhorro.numero_cuenta}). Saldo disponible: $${cuentaAhorro.saldo_cuenta.toFixed(2)}, Monto requerido de apertura: $350.00.`
      );
    }

    const numeroCuentaCorriente = '10' + Math.floor(10000000 + Math.random() * 90000000).toString();

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

    const [cuentaAhorrosActualizada, nuevaCuenta, solicitud] = await prisma.$transaction(async (tx) => {
      // 1. Debitar 350.00 de la cuenta de ahorros
      const debitedAhorro = await tx.cuenta.update({
        where: { id_cuenta: cuentaAhorro.id_cuenta },
        data: {
          saldo_cuenta: { decrement: 350.0 },
        },
      });

      // 2. Crear la cuenta corriente con saldo inicial de 350.00
      const createdCuenta = await tx.cuenta.create({
        data: {
          id_usuario,
          tipo_cuenta: 'Corriente',
          numero_cuenta: numeroCuentaCorriente,
          saldo_cuenta: 350.0,
        },
      });

      // 3. Crear registro en la nueva tabla solicitudes_cuenta_corriente
      const createdSolicitud = await tx.solicitudCuentaCorriente.create({
        data: {
          id_usuario,
          id_cuenta: createdCuenta.id_cuenta,
          tiene_residencia_usa: Boolean(tiene_residencia_usa),
          declara_impuestos_otro_pais: Boolean(declara_impuestos_otro_pais),
          modelo_chequera: modelo_chequera.trim(),
          numero_cheques: Number(numero_cheques) || 20,
          tipo_chequera: tipo_chequera?.trim() || 'Con talón',
          nombre_en_documentos: docName,
          agencia_retiro: agencia_retiro.trim(),
          metodo_pago: 'DEBITO_AHORROS',
          monto_apertura: 350.0,
          estado: 'APROBADA',
        },
      });

      // 4. Registrar movimiento débito en cuenta de ahorros
      await tx.movimiento.create({
        data: {
          id_usuario,
          id_tipo_movimiento: tipoTransfer.id_tipo_movimiento,
          nombre_movimiento: 'Apertura Cuenta Corriente (Débito $350.00)',
          descripcion: `Débito de $350.00 para saldo inicial de Cuenta Corriente N° ${createdCuenta.numero_cuenta}`,
          valor_movimiento: -350.0,
        },
      });

      // 5. Registrar movimiento crédito en cuenta corriente
      await tx.movimiento.create({
        data: {
          id_usuario,
          id_tipo_movimiento: tipoTransfer.id_tipo_movimiento,
          nombre_movimiento: 'Depósito Inicial Apertura Cuenta Corriente',
          descripcion: `Depósito inicial transferido desde Cuenta de Ahorro N° ${cuentaAhorro.numero_cuenta}`,
          valor_movimiento: 350.0,
        },
      });

      return [debitedAhorro, createdCuenta, createdSolicitud];
    });

    return {
      exito: true,
      metodo_pago: 'DEBITO_AHORROS',
      estado: 'APROBADA',
      mensaje: '¡Cuenta corriente creada exitosamente! Se debitaron $350.00 de tu cuenta de ahorros como depósito inicial.',
      cuenta: {
        id_cuenta: nuevaCuenta.id_cuenta,
        numero_cuenta: nuevaCuenta.numero_cuenta,
        tipo_cuenta: nuevaCuenta.tipo_cuenta,
        saldo_cuenta: nuevaCuenta.saldo_cuenta,
      },
      solicitud: {
        id_solicitud: solicitud.id_solicitud,
        tiene_residencia_usa: solicitud.tiene_residencia_usa,
        declara_impuestos_otro_pais: solicitud.declara_impuestos_otro_pais,
        modelo_chequera: solicitud.modelo_chequera,
        numero_cheques: solicitud.numero_cheques,
        tipo_chequera: solicitud.tipo_chequera,
        nombre_en_documentos: solicitud.nombre_en_documentos,
        agencia_retiro: solicitud.agencia_retiro,
        metodo_pago: solicitud.metodo_pago,
        monto_apertura: solicitud.monto_apertura,
        estado: solicitud.estado,
        fecha_creacion: solicitud.fecha_creacion,
      },
    };
  }

  /**
   * Obtiene el historial de solicitudes de cuenta corriente del usuario
   */
  public async getSolicitudesCuentaCorriente(id_usuario?: string) {
    if (!id_usuario) {
      throw new UnauthorizedError('Usuario no autorizado');
    }

    return await prisma.solicitudCuentaCorriente.findMany({
      where: { id_usuario },
      include: { cuenta: true },
      orderBy: { fecha_creacion: 'desc' },
    });
  }
}

export const cuentasService = new CuentasService();
