import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema } from '../schemas/auth.schema';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación de usuarios
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cedula
 *               - nombres
 *               - usuario
 *               - email
 *               - password
 *             properties:
 *               cedula:
 *                 type: string
 *                 example: "0912345678"
 *               nombres:
 *                 type: string
 *                 example: "Lois Becket"
 *               usuario:
 *                 type: string
 *                 pattern: "^[a-zA-Z0-9_-]+$"
 *                 description: "Nombre de usuario (solo texto, números, guion bajo y guion medio)"
 *                 example: "lois_becket-01"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "loisbecket@gmail.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Error en la solicitud o formato inválido del campo usuario
 *       409:
 *         description: Conflicto - el nombre de usuario, cédula o email ya se encuentra registrado
 */
router.post('/register', validate(registerSchema), register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Autenticación mediante nombre de usuario y contraseña (ya no utiliza email)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usuario
 *               - password
 *             properties:
 *               usuario:
 *                 type: string
 *                 example: "lois_becket"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login exitoso, devuelve el JWT y la información del usuario
 *       400:
 *         description: Nombre de usuario o contraseña faltantes
 *       401:
 *         description: Credenciales inválidas
 *       400:
 *         description: Error de validación
 */
router.post('/login', validate(loginSchema), login);

export default router;
