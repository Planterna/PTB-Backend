import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string({ required_error: 'DATABASE_URL es obligatoria' }),
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z.string({ required_error: 'JWT_SECRET es obligatorio' }).default('super_secret_jwt_key'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:4200'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Error en las variables de entorno:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
