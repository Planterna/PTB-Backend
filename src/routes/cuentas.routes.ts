import { Router } from 'express';
import { getCuentas, createCuenta } from '../controllers/cuentas.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createCuentaSchema } from '../schemas/cuentas.schema';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Cuentas
 *   description: Gestión de cuentas bancarias (ahorro o corriente)
 */

router.use(authenticateJWT);

/**
 * @swagger
 * /api/cuentas:
 *   get:
 *     summary: Obtener todas las cuentas del usuario autenticado
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de cuentas y sus movimientos
 *       401:
 *         description: No autorizado
 */
router.get('/', getCuentas);

/**
 * @swagger
 * /api/cuentas:
 *   post:
 *     summary: Crear una nueva cuenta
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo_cuenta
 *               - numero_cuenta
 *             properties:
 *               tipo_cuenta:
 *                 type: string
 *                 enum: [ahorro, corriente]
 *               numero_cuenta:
 *                 type: string
 *                 description: Número único de 10 dígitos que comienza con 10
 *               saldo_cuenta:
 *                 type: number
 *     responses:
 *       201:
 *         description: Cuenta creada exitosamente
 *       400:
 *         description: Datos inválidos o número de cuenta duplicado
 *       401:
 *         description: No autorizado
 */
router.post('/', validate(createCuentaSchema), createCuenta);

export default router;
