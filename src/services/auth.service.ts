import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { RegisterUserDTO, LoginUserDTO, isValidUsuario } from '../models/usuario.model';
import { BadRequestError, UnauthorizedError, ConflictError } from '../errors/http.error';
import { Usuario } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key';

export class AuthService {
  /**
   * Registra un nuevo usuario con validaciones de campos y unicidad de usuario.
   */
  public async register(data: RegisterUserDTO): Promise<Usuario> {
    const { cedula, nombres, usuario, email, password } = data;

    if (!cedula || !nombres || !usuario || !email || !password) {
      throw new BadRequestError('Todos los campos son obligatorios (cedula, nombres, usuario, email, password)');
    }

    // Validación de formato: solo letras, números, guion bajo (_) y guion medio (-)
    if (!isValidUsuario(usuario)) {
      throw new BadRequestError(
        'El campo usuario solo puede contener letras, números, guion bajo (_) y guion medio (-)'
      );
    }

    // Comprobación de unicidad previa en la base de datos
    const existingUser = await prisma.usuario.findFirst({
      where: {
        OR: [
          { usuario: usuario },
          { email_usuario: email },
          { cedula_usuario: cedula },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.usuario.toLowerCase() === usuario.toLowerCase()) {
        throw new ConflictError('El nombre de usuario ya se encuentra registrado');
      }
      if (existingUser.cedula_usuario === cedula) {
        throw new ConflictError('La cédula ya se encuentra registrada');
      }
      if (existingUser.email_usuario.toLowerCase() === email.toLowerCase()) {
        throw new ConflictError('El correo electrónico ya se encuentra registrado');
      }
      throw new ConflictError('El usuario ya existe (datos duplicados)');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const newUser = await prisma.usuario.create({
        data: {
          cedula_usuario: cedula,
          nombres_usuario: nombres,
          usuario: usuario,
          email_usuario: email,
          password_usuario: hashedPassword,
        },
      });

      return newUser;
    } catch (err: any) {
      // Captura de constraint único de Prisma en caso de concurrencia
      if (err.code === 'P2002') {
        const target = (err.meta?.target as string[]) || [];
        if (target.includes('usuario')) {
          throw new ConflictError('El nombre de usuario ya se encuentra registrado');
        }
        if (target.includes('cedula_usuario')) {
          throw new ConflictError('La cédula ya se encuentra registrada');
        }
        if (target.includes('email_usuario')) {
          throw new ConflictError('El correo electrónico ya se encuentra registrado');
        }
        throw new ConflictError('Error de duplicidad en los datos ingresados');
      }
      throw err;
    }
  }

  /**
   * Autentica a un usuario exclusivamente por su nombre de usuario y contraseña.
   */
  public async login(credentials: LoginUserDTO): Promise<{ user: Usuario; token: string }> {
    const { usuario, password } = credentials;

    if (!usuario || !password) {
      throw new BadRequestError('El nombre de usuario y la contraseña son obligatorios');
    }

    const cleanInput = usuario.trim();

    // Buscar por nombre de usuario o por correo (insensible a mayúsculas/minúsculas)
    const user = await prisma.usuario.findFirst({
      where: {
        OR: [
          { usuario: { equals: cleanInput, mode: 'insensitive' } },
          { email_usuario: { equals: cleanInput, mode: 'insensitive' } },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_usuario);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const token = jwt.sign(
      { id: user.id_usuario, email: user.email_usuario, usuario: user.usuario },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return { user, token };
  }
}

export const authService = new AuthService();
