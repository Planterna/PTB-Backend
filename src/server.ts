import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import tarjetasRoutes from './routes/tarjetas.routes';
import movimientosRoutes from './routes/movimientos.routes';
import cuentasRoutes from './routes/cuentas.routes';
import usuarioRoutes from './routes/usuario.routes';
import { setupSwagger } from './config/swagger';
import { errorHandler } from './middlewares/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Setup Swagger UI
setupSwagger(app);

app.use('/api/auth', authRoutes);
app.use('/api/usuario', usuarioRoutes);
app.use('/api/cuentas', cuentasRoutes);
app.use('/api/tarjetas', tarjetasRoutes);
app.use('/api/movimientos', movimientosRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Middleware centralizado de manejo de errores
app.use(errorHandler);

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT} (0.0.0.0)`);
  });
}

export default app;
