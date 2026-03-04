import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRoutes from './routes/index.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Manejo de rutas no encontradas
app.use((req, res, next) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
