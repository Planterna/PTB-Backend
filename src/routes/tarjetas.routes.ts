import { Router } from 'express';
import { getTarjetas, createTarjeta } from '../controllers/tarjetas.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

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
 *               - nombre_tarjeta
 *               - numero_tarjeta
 *             properties:
 *               nombre_tarjeta:
 *                 type: string
 *               numero_tarjeta:
 *                 type: string
 *               saldo_tarjeta:
 *                 type: number
 *     responses:
 *       201:
 *         description: Tarjeta creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post('/', createTarjeta);

export default router;
