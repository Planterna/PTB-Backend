import { Router } from 'express';
import { getMovimientos, createMovimiento } from '../controllers/movimientos.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createMovimientoSchema } from '../schemas/movimientos.schema';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Movimientos
 *   description: Gestión de transacciones/movimientos del usuario
 */

// Todas las rutas de movimientos requieren autenticación
router.use(authenticateJWT);

/**
 * @swagger
 * /api/movimientos:
 *   get:
 *     summary: Obtener todos los movimientos del usuario autenticado
 *     tags: [Movimientos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de movimientos
 *       401:
 *         description: No autorizado
 */
router.get('/', getMovimientos);

/**
 * @swagger
 * /api/movimientos:
 *   post:
 *     summary: Crear un nuevo movimiento
 *     tags: [Movimientos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre_movimiento
 *               - valor_movimiento
 *               - tipo_movimiento
 *             properties:
 *               nombre_movimiento:
 *                 type: string
 *               valor_movimiento:
 *                 type: number
 *               tipo_movimiento:
 *                 type: string
 *                 enum: [transfer, purchase, subscription, deposit]
 *     responses:
 *       201:
 *         description: Movimiento creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/', validate(createMovimientoSchema), createMovimiento);

export default router;
