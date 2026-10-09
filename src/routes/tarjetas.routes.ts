import { Router } from 'express';
import { getTarjetas, createTarjeta } from '../controllers/tarjetas.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createTarjetaSchema } from '../schemas/tarjetas.schema';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Tarjetas
 *   description: Gestión de tarjetas del usuario
 */

// Todas las rutas de tarjetas requieren autenticación
router.use(authenticateJWT);

/**
 * @swagger
 * /api/tarjetas:
 *   get:
 *     summary: Obtener todas las tarjetas del usuario autenticado
 *     tags: [Tarjetas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tarjetas
 *       401:
 *         description: No autorizado
 */
router.get('/', getTarjetas);

/**
 * @swagger
 * /api/tarjetas:
 *   post:
 *     summary: Crear una nueva tarjeta
 *     tags: [Tarjetas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_cuenta
 *               - nombre_tarjeta
 *               - numero_tarjeta
 *             properties:
 *               id_cuenta:
 *                 type: string
 *                 format: uuid
 *               nombre_tarjeta:
 *                 type: string
 *               numero_tarjeta:
 *                 type: string
 *                 description: Número único de 16 dígitos
 *     responses:
 *       201:
 *         description: Tarjeta creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/', validate(createTarjetaSchema), createTarjeta);

export default router;
