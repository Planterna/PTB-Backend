import { PrismaClient, TipoMovimiento } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Upsert user
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

  console.log(`Usuario creado/verificado: ${user.email_usuario}`);

  // Create default card if not exists
  const cards = await prisma.tarjeta.findMany({
    where: { id_usuario: user.id_usuario },
  });

  let cardId = '';
  if (cards.length === 0) {
    const card = await prisma.tarjeta.create({
      data: {
        id_usuario: user.id_usuario,
        nombre_tarjeta: 'Prestige Visa',
        numero_tarjeta: '**** 4022',
        saldo_tarjeta: 14500.50,
      },
    });
    cardId = card.id_tarjeta;
    console.log(`Tarjeta creada: ${card.nombre_tarjeta}`);
  } else {
    cardId = cards[0].id_tarjeta;
    console.log(`El usuario ya tiene tarjetas.`);
  }

  // Create default transactions if not exists
  const transactions = await prisma.movimiento.findMany({
    where: { id_usuario: user.id_usuario },
  });

  if (transactions.length === 0) {
    await prisma.movimiento.createMany({
      data: [
        {
          id_usuario: user.id_usuario,
          nombre_movimiento: 'Transferencia a Juan',
          valor_movimiento: -150.00,
          tipo_movimiento: TipoMovimiento.transfer,
        },
        {
          id_usuario: user.id_usuario,
          nombre_movimiento: 'Amazon.com',
          valor_movimiento: -45.99,
          tipo_movimiento: TipoMovimiento.purchase,
        },
        {
          id_usuario: user.id_usuario,
          nombre_movimiento: 'Netflix',
          valor_movimiento: -15.99,
          tipo_movimiento: TipoMovimiento.subscription,
        },
        {
          id_usuario: user.id_usuario,
          nombre_movimiento: 'Depósito Nómina',
          valor_movimiento: 2500.00,
          tipo_movimiento: TipoMovimiento.deposit,
        },
      ],
    });
    console.log('Movimientos semilla creados.');
  } else {
    console.log('El usuario ya tiene movimientos.');
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
