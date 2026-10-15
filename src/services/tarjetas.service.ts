import prisma from '../config/prisma';
import { CreateTarjetaDTO } from '../models/tarjeta.model';
import { BadRequestError, UnauthorizedError } from '../errors/http.error';
import { Tarjeta } from '@prisma/client';

export class TarjetasService {
  public async getTarjetas(id_usuario?: string): Promise<Tarjeta[]> {
    if (!id_usuario) {
      throw new UnauthorizedError('Usuario no autorizado');
    }

    return await prisma.tarjeta.findMany({
      where: { id_usuario },
      orderBy: { fecha_creacion: 'desc' },
    });
  }

  public async createTarjeta(id_usuario?: string, data?: CreateTarjetaDTO): Promise<Tarjeta> {
    if (!id_usuario) {
      throw new UnauthorizedError('Usuario no autorizado');
    }

    if (!data || !data.nombre_tarjeta || !data.numero_tarjeta) {
      throw new BadRequestError('Nombre y número de tarjeta son obligatorios');
    }

    return await prisma.tarjeta.create({
      data: {
        id_usuario,
        nombre_tarjeta: data.nombre_tarjeta,
        numero_tarjeta: data.numero_tarjeta,
        saldo_tarjeta: data.saldo_tarjeta !== undefined ? Number(data.saldo_tarjeta) : 0.0,
      },
    });
  }
}

export const tarjetasService = new TarjetasService();
