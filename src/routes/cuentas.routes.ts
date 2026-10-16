import { Router } from 'express';
import {
  getBancos,
  getCuentas,
  createCuenta,
  validarCuenta,
  validarCuentaInterbancaria,
  transferir,
  transferirInterbancaria,
  crearCuentaCorriente,
  getSolicitudesCuentaCorriente,
} from '../controllers/cuentas.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Cuentas y Transferencias
 *   description: Gestión de cuentas bancarias, validación y transferencias locales e interbancarias
 */

// Todas las rutas requieren autenticación
router.use(authenticateJWT);

/**
 * @swagger
 * /api/cuentas/bancos:
 *   get:
 *     summary: Obtener catálogo de bancos disponibles
 *     tags: [Cuentas y Transferencias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de bancos registrados
 */
router.get('/bancos', getBancos);

/**
 * @swagger
 * /api/cuentas:
 *   get:
 *     summary: Obtener todas las cuentas del usuario autenticado
 *     tags: [Cuentas y Transferencias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de cuentas bancarias del usuario
 *       401:
 *         description: No autorizado
 */
router.get('/', getCuentas);

/**
 * @swagger
 * /api/cuentas:
 *   post:
 *     summary: Crear una nueva cuenta para el usuario
 *     tags: [Cuentas y Transferencias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo_cuenta:
 *                 type: string
 *                 example: "Ahorros"
 *               numero_cuenta:
 *                 type: string
 *                 example: "1002345678"
 *               saldo_cuenta:
 *                 type: number
 *                 example: 1000.00
 *     responses:
 *       201:
 *         description: Cuenta creada exitosamente
 */
router.post('/', createCuenta);

/**
 * @swagger
 * /api/cuentas/validar:
 *   post:
 *     summary: Validar si un número de cuenta existe (local o interbancaria)
 *     description: "Valida una cuenta. Si se envía el campo banco con otro banco (o es_interbancaria: true), se valida en la tabla de cuentas interbancarias; de lo contrario en cuentas locales."
 *     tags: [Cuentas y Transferencias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero_cuenta
 *             properties:
 *               numero_cuenta:
 *                 type: string
 *                 example: "1009876543"
 *               banco:
 *                 type: string
 *                 example: "Prestige Trust Bank"
 *               es_interbancaria:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Cuenta válida y encontrada
 *       400:
 *         description: Número de cuenta inválido
 *       404:
 *         description: La cuenta no existe en el sistema
 */
router.post('/validar', validarCuenta);

/**
 * @swagger
 * /api/cuentas/validar/{numero_cuenta}:
 *   get:
 *     summary: Validar cuenta local mediante parámetro de ruta
 *     tags: [Cuentas y Transferencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: numero_cuenta
 *         required: true
 *         schema:
 *           type: string
 *         example: "1009876543"
 *     responses:
 *       200:
 *         description: Cuenta válida
 *       404:
 *         description: Cuenta no encontrada
 */
router.get('/validar/:numero_cuenta', validarCuenta);

/**
 * @swagger
 * /api/cuentas/validar-interbancaria:
 *   post:
 *     summary: Validar cuenta en la tabla de simulación interbancaria
 *     description: Valida si la cuenta destino existe en otro banco simulado (ej. Banco Pichincha, Banco Guayaquil).
 *     tags: [Cuentas y Transferencias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero_cuenta
 *             properties:
 *               numero_cuenta:
 *                 type: string
 *                 example: "2204567891"
 *               banco:
 *                 type: string
 *                 example: "Banco Pichincha"
 *     responses:
 *       200:
 *         description: Cuenta interbancaria válida
 *       404:
 *         description: La cuenta interbancaria destino no existe o no se encuentra habilitada
 */
router.post('/validar-interbancaria', validarCuentaInterbancaria);

/**
 * @swagger
 * /api/cuentas/validar-interbancaria/{numero_cuenta}:
 *   get:
 *     summary: Validar cuenta interbancaria mediante parámetro de ruta
 *     tags: [Cuentas y Transferencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: numero_cuenta
 *         required: true
 *         schema:
 *           type: string
 *         example: "2204567891"
 *     responses:
 *       200:
 *         description: Cuenta interbancaria válida
 *       404:
 *         description: Cuenta interbancaria no encontrada
 */
router.get('/validar-interbancaria/:numero_cuenta', validarCuentaInterbancaria);

/**
 * @swagger
 * /api/cuentas/transferir:
 *   post:
 *     summary: Realizar transferencia local (dentro de Prestige Trust Bank)
 *     description: Debita de la cuenta de origen, acredita a la de destino y genera movimientos atómicos.
 *     tags: [Cuentas y Transferencias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cuenta_origen
 *               - cuenta_destino
 *               - monto
 *             properties:
 *               cuenta_origen:
 *                 type: string
 *                 example: "1002345678"
 *               cuenta_destino:
 *                 type: string
 *                 example: "1009876543"
 *               monto:
 *                 type: number
 *                 example: 200.00
 *               descripcion:
 *                 type: string
 *                 example: "Almuerzo, Cuota arriendo"
 *     responses:
 *       200:
 *         description: Transferencia procesada con éxito
 *       400:
 *         description: Saldo insuficiente o datos inválidos
 *       404:
 *         description: Cuenta origen o destino no encontrada
 */
router.post('/transferir', transferir);

/**
 * @swagger
 * /api/cuentas/transferir-interbancaria:
 *   post:
 *     summary: Realizar transferencia interbancaria (hacia cuenta de otro banco)
 *     description: Debita de la cuenta de origen del usuario en Prestige Bank, valida y acredita en la cuenta simulada de otro banco, y registra el movimiento de débito.
 *     tags: [Cuentas y Transferencias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cuenta_origen
 *               - numero_cuenta_destino
 *               - monto
 *             properties:
 *               cuenta_origen:
 *                 type: string
 *                 example: "1002345678"
 *               numero_cuenta_destino:
 *                 type: string
 *                 example: "2204567891"
 *               monto:
 *                 type: number
 *                 example: 50.00
 *               descripcion:
 *                 type: string
 *                 example: "Pago cuota mensual"
 *     responses:
 *       200:
 *         description: Transferencia interbancaria realizada exitosamente
 *       400:
 *         description: Saldo insuficiente o datos inválidos
 *       404:
 *         description: La cuenta interbancaria destino no existe o no se encuentra habilitada
 */
router.post('/transferir-interbancaria', transferirInterbancaria);

/**
 * @swagger
 * /api/cuentas/corriente:
 *   post:
 *     summary: Crear o solicitar apertura de Cuenta Corriente
 *     description: Guarda la información del formulario migratorio, fiscal y de chequera. Si el método de pago es DEBITO_AHORROS, debita $350 de la cuenta de ahorros y crea la cuenta corriente con $350 iniciales. Si es PAGO_VENTANILLA, registra la solicitud en espera de depósito físico.
 *     tags: [Cuentas y Transferencias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modelo_chequera
 *               - agencia_retiro
 *               - metodo_pago
 *             properties:
 *               tiene_residencia_usa:
 *                 type: boolean
 *               declara_impuestos_otro_pais:
 *                 type: boolean
 *               modelo_chequera:
 *                 type: string
 *                 example: "Institucional"
 *               numero_cheques:
 *                 type: number
 *                 example: 20
 *               tipo_chequera:
 *                 type: string
 *                 example: "Con talón"
 *               nombre_en_documentos:
 *                 type: string
 *                 example: "Lois Becket"
 *               agencia_retiro:
 *                 type: string
 *                 example: "Agencia Principal Centro"
 *               metodo_pago:
 *                 type: string
 *                 enum: [DEBITO_AHORROS, PAGO_VENTANILLA]
 *                 example: "DEBITO_AHORROS"
 *     responses:
 *       201:
 *         description: Cuenta corriente creada o solicitud registrada
 *       400:
 *         description: Saldo insuficiente o datos inválidos
 */
router.post('/corriente', crearCuentaCorriente);

/**
 * @swagger
 * /api/cuentas/solicitudes-corriente:
 *   get:
 *     summary: Consultar historial de solicitudes de cuenta corriente del usuario
 *     tags: [Cuentas y Transferencias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Listado de solicitudes
 */
router.get('/solicitudes-corriente', getSolicitudesCuentaCorriente);

export default router;
