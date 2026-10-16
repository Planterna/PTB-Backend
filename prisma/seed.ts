import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando sembrado normalizado de la base de datos PTB...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // ==========================================
  // 1. TIPOS DE MOVIMIENTO (tabla `tipos_movimiento`)
  // ==========================================
  const tiposMovimientoData = [
    { codigo: 'transfer', nombre: 'Transferencia', descripcion: 'Transferencias locales e interbancarias' },
    { codigo: 'purchase', nombre: 'Compra', descripcion: 'Pagos con tarjeta y compras en comercios' },
    { codigo: 'subscription', nombre: 'Suscripción', descripcion: 'Cobros recurrentes de servicios y membresías' },
    { codigo: 'deposit', nombre: 'Depósito', descripcion: 'Depósitos en ventanilla y transferencias recibidas' },
  ];

  const tiposMovMap: Record<string, any> = {};

  for (const tm of tiposMovimientoData) {
    const record = await prisma.tipoMovimiento.upsert({
      where: { codigo: tm.codigo },
      update: { nombre: tm.nombre, descripcion: tm.descripcion },
      create: tm,
    });
    tiposMovMap[tm.codigo] = record;
  }
  console.log('✅ Catálogo de Tipos de Movimiento inicializado.');

  // ==========================================
  // 2. BANCOS (tabla `bancos`)
  // ==========================================
  const bancosData = [
    { codigo_banco: 'PTB', nombre_banco: 'Prestige Trust Bank', es_banco_local: true },
    { codigo_banco: 'PICHINCHA', nombre_banco: 'Banco Pichincha', es_banco_local: false },
    { codigo_banco: 'GUAYAQUIL', nombre_banco: 'Banco Guayaquil', es_banco_local: false },
    { codigo_banco: 'PRODUBANCO', nombre_banco: 'Produbanco', es_banco_local: false },
    { codigo_banco: 'PACIFICO', nombre_banco: 'Banco del Pacífico', es_banco_local: false },
    { codigo_banco: 'BOLIVARIANO', nombre_banco: 'Banco Bolivariano', es_banco_local: false },
    { codigo_banco: 'JEP', nombre_banco: 'Cooperativa JEP', es_banco_local: false },
  ];

  const bancosMap: Record<string, any> = {};

  for (const b of bancosData) {
    const record = await prisma.banco.upsert({
      where: { codigo_banco: b.codigo_banco },
      update: { nombre_banco: b.nombre_banco, es_banco_local: b.es_banco_local },
      create: b,
    });
    bancosMap[b.codigo_banco] = record;
  }
  console.log('✅ Catálogo de Bancos inicializado.');

  // ==========================================
  // 3. CUENTAS INTERBANCARIAS (simulación de otros bancos: Ahorros y Corriente)
  // ==========================================
  const cuentasInterbancariasData = [
    // Banco Pichincha
    {
      id_banco: bancosMap['PICHINCHA'].id_banco,
      numero_cuenta: '2204567891',
      tipo_cuenta: 'Ahorros',
      titular_cuenta: 'Esteban Gabriel Morales',
      cedula_titular: '1102938475',
      saldo_cuenta: 1200.00,
      activa: true,
    },
    {
      id_banco: bancosMap['PICHINCHA'].id_banco,
      numero_cuenta: '2209876543',
      tipo_cuenta: 'Corriente',
      titular_cuenta: 'Esteban Gabriel Morales',
      cedula_titular: '1102938475',
      saldo_cuenta: 3450.00,
      activa: true,
    },
    // Banco Guayaquil
    {
      id_banco: bancosMap['GUAYAQUIL'].id_banco,
      numero_cuenta: '2401234567',
      tipo_cuenta: 'Ahorros',
      titular_cuenta: 'Diana Sofía Viteri',
      cedula_titular: '1719283746',
      saldo_cuenta: 3890.20,
      activa: true,
    },
    {
      id_banco: bancosMap['GUAYAQUIL'].id_banco,
      numero_cuenta: '2408765432',
      tipo_cuenta: 'Corriente',
      titular_cuenta: 'Diana Sofía Viteri',
      cedula_titular: '1719283746',
      saldo_cuenta: 2100.00,
      activa: true,
    },
    // Produbanco
    {
      id_banco: bancosMap['PRODUBANCO'].id_banco,
      numero_cuenta: '1701234567',
      tipo_cuenta: 'Ahorros',
      titular_cuenta: 'Fernando José Castro',
      cedula_titular: '1709876543',
      saldo_cuenta: 1540.00,
      activa: true,
    },
    {
      id_banco: bancosMap['PRODUBANCO'].id_banco,
      numero_cuenta: '1705647382',
      tipo_cuenta: 'Corriente',
      titular_cuenta: 'Fernando José Castro',
      cedula_titular: '1709876543',
      saldo_cuenta: 850.00,
      activa: true,
    },
    // Banco del Pacífico
    {
      id_banco: bancosMap['PACIFICO'].id_banco,
      numero_cuenta: '3301928374',
      tipo_cuenta: 'Ahorros',
      titular_cuenta: 'Valeria Nicole Pazmiño',
      cedula_titular: '0928374651',
      saldo_cuenta: 4500.00,
      activa: true,
    },
    {
      id_banco: bancosMap['PACIFICO'].id_banco,
      numero_cuenta: '3309876541',
      tipo_cuenta: 'Corriente',
      titular_cuenta: 'Valeria Nicole Pazmiño',
      cedula_titular: '0928374651',
      saldo_cuenta: 1980.00,
      activa: true,
    },
    // Banco Bolivariano
    {
      id_banco: bancosMap['BOLIVARIANO'].id_banco,
      numero_cuenta: '0005123456',
      tipo_cuenta: 'Ahorros',
      titular_cuenta: 'Roberto Carlos Noboa',
      cedula_titular: '0912457812',
      saldo_cuenta: 3120.00,
      activa: true,
    },
    {
      id_banco: bancosMap['BOLIVARIANO'].id_banco,
      numero_cuenta: '0005987654',
      tipo_cuenta: 'Corriente',
      titular_cuenta: 'Roberto Carlos Noboa',
      cedula_titular: '0912457812',
      saldo_cuenta: 4850.00,
      activa: true,
    },
    // Cooperativa JEP
    {
      id_banco: bancosMap['JEP'].id_banco,
      numero_cuenta: '4001234567',
      tipo_cuenta: 'Ahorros',
      titular_cuenta: 'Patricia Marisol Guamán',
      cedula_titular: '0102938475',
      saldo_cuenta: 950.00,
      activa: true,
    },
    {
      id_banco: bancosMap['JEP'].id_banco,
      numero_cuenta: '4009876543',
      tipo_cuenta: 'Corriente',
      titular_cuenta: 'Patricia Marisol Guamán',
      cedula_titular: '0102938475',
      saldo_cuenta: 2300.00,
      activa: true,
    },
  ];

  for (const ci of cuentasInterbancariasData) {
    await prisma.cuentaInterbancaria.upsert({
      where: { numero_cuenta: ci.numero_cuenta },
      update: {
        saldo_cuenta: ci.saldo_cuenta,
        titular_cuenta: ci.titular_cuenta,
        cedula_titular: ci.cedula_titular,
        tipo_cuenta: ci.tipo_cuenta,
        activa: ci.activa,
      },
      create: ci,
    });
  }
  console.log(`✅ Cuentas interbancarias simuladas listas: ${cuentasInterbancariasData.length} cuentas (Ahorros y Corriente).`);

  // ==========================================
  // 4. USUARIOS LOCALES
  // ==========================================
  const usuariosData = [
    {
      cedula_usuario: '0912345678',
      nombres_usuario: 'Lois Becket',
      usuario: 'lois_becket',
      email_usuario: 'loisbecket@gmail.com',
      password_usuario: hashedPassword,
    },
    {
      cedula_usuario: '1723456789',
      nombres_usuario: 'Carlos Andrés Mendoza',
      usuario: 'carlos_mendoza',
      email_usuario: 'carlos@ptb.com',
      password_usuario: hashedPassword,
    },
    {
      cedula_usuario: '0918765432',
      nombres_usuario: 'María Elena Rodríguez',
      usuario: 'maria_rodriguez',
      email_usuario: 'maria@ptb.com',
      password_usuario: hashedPassword,
    },
  ];

  const usuariosCreados: Record<string, any> = {};

  for (const u of usuariosData) {
    const user = await prisma.usuario.upsert({
      where: { email_usuario: u.email_usuario },
      update: {
        usuario: u.usuario,
        nombres_usuario: u.nombres_usuario,
        cedula_usuario: u.cedula_usuario,
      },
      create: u,
    });
    usuariosCreados[u.usuario] = user;
    console.log(`👤 Usuario listo: ${user.nombres_usuario} (@${user.usuario})`);
  }

  const mainUser = usuariosCreados['lois_becket'];
  const carlosUser = usuariosCreados['carlos_mendoza'];
  const mariaUser = usuariosCreados['maria_rodriguez'];

  // ==========================================
  // 5. CUENTAS LOCALES (Prestige Trust Bank: Ahorros y Corriente)
  // ==========================================
  const cuentasData = [
    // Lois Becket (Usuario principal de prueba): Ahorros y Corriente
    {
      id_usuario: mainUser.id_usuario,
      tipo_cuenta: 'Ahorros',
      numero_cuenta: '1002345678',
      saldo_cuenta: 14500.50,
    },
    {
      id_usuario: mainUser.id_usuario,
      tipo_cuenta: 'Corriente',
      numero_cuenta: '1002345679',
      saldo_cuenta: 3500.00,
    },

    // Carlos Andrés Mendoza: Ahorros y Corriente
    {
      id_usuario: carlosUser.id_usuario,
      tipo_cuenta: 'Ahorros',
      numero_cuenta: '1009876542',
      saldo_cuenta: 1800.00,
    },
    {
      id_usuario: carlosUser.id_usuario,
      tipo_cuenta: 'Corriente',
      numero_cuenta: '1009876543',
      saldo_cuenta: 2450.00,
    },

    // María Elena Rodríguez: Ahorros y Corriente
    {
      id_usuario: mariaUser.id_usuario,
      tipo_cuenta: 'Ahorros',
      numero_cuenta: '1004567890',
      saldo_cuenta: 5120.75,
    },
    {
      id_usuario: mariaUser.id_usuario,
      tipo_cuenta: 'Corriente',
      numero_cuenta: '1004567891',
      saldo_cuenta: 3200.00,
    },
  ];

  const cuentasCreadas: Record<string, any> = {};

  for (const c of cuentasData) {
    const cuenta = await prisma.cuenta.upsert({
      where: { numero_cuenta: c.numero_cuenta },
      update: {
        saldo_cuenta: c.saldo_cuenta,
        tipo_cuenta: c.tipo_cuenta,
      },
      create: c,
    });
    cuentasCreadas[c.numero_cuenta] = cuenta;
    console.log(`🏦 Cuenta local: ${cuenta.tipo_cuenta} N° ${cuenta.numero_cuenta} ($${cuenta.saldo_cuenta.toFixed(2)})`);
  }

  // ==========================================
  // 6. SOLICITUDES DE CUENTA CORRIENTE (tabla `solicitudes_cuenta_corriente`)
  // Contiene la información requerida del formulario:
  // chequera, fiscal, agencia y débito de $350.00
  // ==========================================
  const solicitudesData = [
    {
      id_usuario: mainUser.id_usuario,
      id_cuenta: cuentasCreadas['1002345679'].id_cuenta,
      tiene_residencia_usa: false,
      declara_impuestos_otro_pais: false,
      modelo_chequera: 'Institucional',
      numero_cheques: 20,
      tipo_chequera: 'Con talón',
      nombre_en_documentos: 'Lois Becket',
      agencia_retiro: 'Agencia Principal Centro',
      metodo_pago: 'DEBITO_AHORROS',
      monto_apertura: 350.0,
      estado: 'APROBADA',
    },
    {
      id_usuario: carlosUser.id_usuario,
      id_cuenta: cuentasCreadas['1009876543'].id_cuenta,
      tiene_residencia_usa: false,
      declara_impuestos_otro_pais: false,
      modelo_chequera: 'Ondas',
      numero_cheques: 50,
      tipo_chequera: 'Con talón',
      nombre_en_documentos: 'Carlos Andrés Mendoza',
      agencia_retiro: 'Agencia Mall del Sol',
      metodo_pago: 'DEBITO_AHORROS',
      monto_apertura: 350.0,
      estado: 'APROBADA',
    },
    {
      id_usuario: mariaUser.id_usuario,
      id_cuenta: cuentasCreadas['1004567891'].id_cuenta,
      tiene_residencia_usa: false,
      declara_impuestos_otro_pais: false,
      modelo_chequera: 'Institucional zurdo',
      numero_cheques: 20,
      tipo_chequera: 'Sin talón',
      nombre_en_documentos: 'María Elena Rodríguez',
      agencia_retiro: 'Agencia Norte Plaza',
      metodo_pago: 'DEBITO_AHORROS',
      monto_apertura: 350.0,
      estado: 'APROBADA',
    },
  ];

  await prisma.solicitudCuentaCorriente.deleteMany({
    where: {
      id_usuario: {
        in: Object.values(usuariosCreados).map((u) => u.id_usuario),
      },
    },
  });

  for (const s of solicitudesData) {
    const solicitud = await prisma.solicitudCuentaCorriente.create({
      data: s,
    });
    console.log(`📝 Solicitud cuenta corriente: ${solicitud.nombre_en_documentos} (${solicitud.modelo_chequera}, ${solicitud.numero_cheques} cheques) - ${solicitud.estado}`);
  }

  // ==========================================
  // 7. TARJETAS
  // ==========================================
  const tarjetasData = [
    {
      id_usuario: mainUser.id_usuario,
      nombre_tarjeta: 'Prestige Visa Platinum',
      numero_tarjeta: '**** 4022',
      saldo_tarjeta: 14500.50,
    },
    {
      id_usuario: mainUser.id_usuario,
      nombre_tarjeta: 'Prestige Mastercard Black',
      numero_tarjeta: '**** 8831',
      saldo_tarjeta: 6200.00,
    },
    {
      id_usuario: carlosUser.id_usuario,
      nombre_tarjeta: 'Prestige Gold Card',
      numero_tarjeta: '**** 5519',
      saldo_tarjeta: 2450.00,
    },
    {
      id_usuario: mariaUser.id_usuario,
      nombre_tarjeta: 'Prestige Visa Signature',
      numero_tarjeta: '**** 7741',
      saldo_tarjeta: 5120.75,
    },
  ];

  await prisma.tarjeta.deleteMany({
    where: {
      id_usuario: {
        in: Object.values(usuariosCreados).map((u) => u.id_usuario),
      },
    },
  });

  for (const t of tarjetasData) {
    await prisma.tarjeta.create({ data: t });
    console.log(`💳 Tarjeta creada: ${t.nombre_tarjeta} (${t.numero_tarjeta})`);
  }

  // ==========================================
  // 8. MOVIMIENTOS
  // ==========================================
  const transferTypeId = tiposMovMap['transfer'].id_tipo_movimiento;
  const purchaseTypeId = tiposMovMap['purchase'].id_tipo_movimiento;
  const subscriptionTypeId = tiposMovMap['subscription'].id_tipo_movimiento;
  const depositTypeId = tiposMovMap['deposit'].id_tipo_movimiento;

  const movimientosData = [
    {
      id_usuario: mainUser.id_usuario,
      id_tipo_movimiento: transferTypeId,
      nombre_movimiento: 'Apertura Cuenta Corriente (Débito $350.00)',
      descripcion: 'Débito de $350.00 para saldo inicial de Cuenta Corriente N° 1002345679',
      valor_movimiento: -350.00,
      fecha_movimiento: new Date(Date.now() - 1000 * 60 * 60 * 120),
    },
    {
      id_usuario: mainUser.id_usuario,
      id_tipo_movimiento: transferTypeId,
      nombre_movimiento: 'Depósito Inicial Apertura Cuenta Corriente',
      descripcion: 'Depósito inicial transferido desde Cuenta de Ahorro N° 1002345678',
      valor_movimiento: 350.00,
      fecha_movimiento: new Date(Date.now() - 1000 * 60 * 60 * 120),
    },
    {
      id_usuario: mainUser.id_usuario,
      id_tipo_movimiento: transferTypeId,
      nombre_movimiento: 'Transferencia a Carlos Andrés Mendoza',
      descripcion: 'Almuerzo, Cuota arriendo',
      valor_movimiento: -150.00,
      fecha_movimiento: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      id_usuario: mainUser.id_usuario,
      id_tipo_movimiento: transferTypeId,
      nombre_movimiento: 'Transferencia interbancaria a Esteban Gabriel Morales (Banco Pichincha)',
      descripcion: 'Pago cuota servicios compartidos',
      valor_movimiento: -60.45,
      fecha_movimiento: new Date(Date.now() - 1000 * 60 * 60 * 6),
    },
    {
      id_usuario: mainUser.id_usuario,
      id_tipo_movimiento: purchaseTypeId,
      nombre_movimiento: 'Supermaxi Los Ceibos',
      descripcion: 'Compras quincenales del hogar',
      valor_movimiento: -85.40,
      fecha_movimiento: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
      id_usuario: mainUser.id_usuario,
      id_tipo_movimiento: subscriptionTypeId,
      nombre_movimiento: 'Suscripción Netflix Premium',
      descripcion: 'Membresía mensual 4 pantallas',
      valor_movimiento: -19.99,
      fecha_movimiento: new Date(Date.now() - 1000 * 60 * 60 * 48),
    },
    {
      id_usuario: mainUser.id_usuario,
      id_tipo_movimiento: depositTypeId,
      nombre_movimiento: 'Depósito Nómina Quincenal',
      descripcion: 'Acreditación sueldo Corporación PTB',
      valor_movimiento: 2500.00,
      fecha_movimiento: new Date(Date.now() - 1000 * 60 * 60 * 72),
    },
    {
      id_usuario: mainUser.id_usuario,
      id_tipo_movimiento: transferTypeId,
      nombre_movimiento: 'Transferencia de María Elena Rodríguez',
      descripcion: 'Devolución de cena fin de semana',
      valor_movimiento: 45.00,
      fecha_movimiento: new Date(Date.now() - 1000 * 60 * 60 * 96),
    },
    {
      id_usuario: carlosUser.id_usuario,
      id_tipo_movimiento: transferTypeId,
      nombre_movimiento: 'Transferencia de Lois Becket',
      descripcion: 'Almuerzo, Cuota arriendo',
      valor_movimiento: 150.00,
      fecha_movimiento: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
  ];

  await prisma.movimiento.deleteMany({
    where: {
      id_usuario: {
        in: Object.values(usuariosCreados).map((u) => u.id_usuario),
      },
    },
  });

  for (const m of movimientosData) {
    await prisma.movimiento.create({
      data: m,
    });
  }
  console.log(`📊 Movimientos vinculados a tabla tipos_movimiento: ${movimientosData.length} creados.`);

  console.log('✨ Sembrado normalizado finalizado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
