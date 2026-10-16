import prisma from '../config/prisma';
import { CreateMovimientoDTO } from '../models/movimiento.model';
import { BadRequestError, UnauthorizedError } from '../errors/http.error';

export class MovimientosService {
  public async getMovimientos(id_usuario?: string) {
    if (!id_usuario) {
      throw new UnauthorizedError('Usuario no autorizado');
    }

    const movimientos = await prisma.movimiento.findMany({
      where: { id_usuario },
      include: {
        tipo_movimiento: true,
      },
      orderBy: { fecha_movimiento: 'desc' },
    });

    // Mapear para mantener compatibilidad con el cliente (tipo_movimiento como string: 'transfer', 'purchase', etc.)
    return movimientos.map((m) => ({
      id_movimiento: m.id_movimiento,
      id_usuario: m.id_usuario,
      id_tipo_movimiento: m.id_tipo_movimiento,
      nombre_movimiento: m.nombre_movimiento,
      descripcion: m.descripcion,
      valor_movimiento: m.valor_movimiento,
      fecha_movimiento: m.fecha_movimiento,
      tipo_movimiento: m.tipo_movimiento?.codigo || 'transfer',
      fecha_creacion: m.fecha_creacion,
      fecha_actualizacion: m.fecha_actualizacion,
    }));
  }

  public async createMovimiento(id_usuario?: string, data?: CreateMovimientoDTO) {
    if (!id_usuario) {
      throw new UnauthorizedError('Usuario no autorizado');
    }

    if (!data || !data.nombre_movimiento || data.valor_movimiento === undefined || !data.tipo_movimiento) {
      throw new BadRequestError('Nombre, valor y tipo de movimiento son obligatorios');
    }

    const tipoCodigo = data.tipo_movimiento.toLowerCase().trim();
    const tipo = await prisma.tipoMovimiento.findUnique({
      where: { codigo: tipoCodigo },
    });

    if (!tipo) {
      throw new BadRequestError(
        `Tipo de movimiento inválido: '${data.tipo_movimiento}'. Debe existir en la tabla tipos_movimiento.`
      );
    }

    const valorNumerico = parseFloat(String(data.valor_movimiento));
    if (isNaN(valorNumerico)) {
      throw new BadRequestError('El valor del movimiento debe ser un número válido');
    }

    const nuevoMovimiento = await prisma.movimiento.create({
      data: {
        id_usuario,
        id_tipo_movimiento: tipo.id_tipo_movimiento,
        nombre_movimiento: data.nombre_movimiento,
        descripcion: data.descripcion || null,
        valor_movimiento: valorNumerico,
      },
      include: {
        tipo_movimiento: true,
      },
    });

    return {
      ...nuevoMovimiento,
      tipo_movimiento: nuevoMovimiento.tipo_movimiento?.codigo || tipoCodigo,
    };
  }
}

export const movimientosService = new MovimientosService();
