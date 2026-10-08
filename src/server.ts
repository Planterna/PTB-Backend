import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import tarjetasRoutes from './routes/tarjetas.routes';
import movimientosRoutes from './routes/movimientos.routes';
import { setupSwagger } from './config/swagger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Setup Swagger UI
setupSwagger(app);

app.use('/api/auth', authRoutes);
app.use('/api/tarjetas', tarjetasRoutes);
app.use('/api/movimientos', movimientosRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
