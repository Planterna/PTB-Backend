import { PrismaClient, TipoMovimiento } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Crear o verificar el usuario
  const user = await prisma.usuario.upsert({
    where: { email_usuario: 'loisbecket@gmail.com' },
    update: {},
    create: {
      cedula_usuario: '0912345678',
      nombres_usuario: 'Lois Becket',
      email_usuario: 'loisbecket@gmail.com',
      password_usuario: hashedPassword,
    },
  });

  console.log(`Usuario semilla listo: ${user.email_usuario}`);

  // 2. Crear o verificar la cuenta del usuario
  const cuentas = await prisma.cuenta.findMany({
    where: { id_usuario: user.id_usuario },
  });

  let cuentaId = '';
  if (cuentas.length === 0) {
    // Generar un número de cuenta (ej. 10 + 8 dígitos)
    const numero_cuenta = '1012345678';
    
    const cuenta = await prisma.cuenta.create({
      data: {
        id_usuario: user.id_usuario,
        tipo_cuenta: 'ahorro',
        numero_cuenta,
        saldo_cuenta: 14500.50, // Saldo inicial semilla
      },
    });
    cuentaId = cuenta.id_cuenta;
    console.log(`Cuenta creada: ${cuenta.numero_cuenta} con saldo ${cuenta.saldo_cuenta}`);
  } else {
    cuentaId = cuentas[0].id_cuenta;
    console.log(`El usuario ya tiene una cuenta: ${cuentas[0].numero_cuenta}`);
  }

  // 3. Crear o verificar tarjeta asociada a la cuenta
  const tarjetas = await prisma.tarjeta.findMany({
    where: { id_cuenta: cuentaId },
  });

  if (tarjetas.length === 0) {
    const numero_tarjeta = '4123456789012345'; // 16 dígitos
    
    const tarjeta = await prisma.tarjeta.create({
      data: {
        id_usuario: user.id_usuario,
        id_cuenta: cuentaId,
        nombre_tarjeta: 'Prestige Visa',
        numero_tarjeta,
        tipo_tarjeta: 'debito',
      },
    });
    console.log(`Tarjeta creada: ${tarjeta.nombre_tarjeta} terminada en ${tarjeta.numero_tarjeta.slice(-4)}`);
  } else {
    console.log(`La cuenta ya tiene tarjetas.`);
  }

  // 4. Crear movimientos semilla
  const transactions = await prisma.movimiento.findMany({
    where: { id_cuenta: cuentaId },
  });

  if (transactions.length === 0) {
    await prisma.movimiento.createMany({
      data: [
        {
          id_usuario: user.id_usuario,
          id_cuenta: cuentaId,
          nombre_movimiento: 'Transferencia a Juan',
          valor_movimiento: -150.00,
          tipo_movimiento: TipoMovimiento.transfer,
        },
        {
          id_usuario: user.id_usuario,
          id_cuenta: cuentaId,
          nombre_movimiento: 'Amazon.com',
          valor_movimiento: -45.99,
          tipo_movimiento: TipoMovimiento.purchase,
        },
        {
          id_usuario: user.id_usuario,
          id_cuenta: cuentaId,
          nombre_movimiento: 'Netflix',
          valor_movimiento: -15.99,
          tipo_movimiento: TipoMovimiento.subscription,
        },
        {
          id_usuario: user.id_usuario,
          id_cuenta: cuentaId,
          nombre_movimiento: 'Depósito Nómina',
          valor_movimiento: 2500.00,
          tipo_movimiento: TipoMovimiento.deposit,
        },
      ],
    });
    console.log('Movimientos semilla creados exitosamente.');
  } else {
    console.log('La cuenta ya tiene movimientos.');
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
