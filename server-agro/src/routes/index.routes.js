import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

// Ruta de prueba
router.get('/health', async (req, res) => {
    try {
        // Ejemplo: Verificar la conexión pidiendo algo básico a Supabase si fuera necesario
        // o simplemente responder un 200 OK:
        res.json({ status: 'OK', message: 'La API está funcionando correctamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'ERROR', message: 'Ocurrió un error en la API.' });
    }
});

import productsRoutes from './products.routes.js';
import categoriesRoutes from './categories.routes.js';
import transactionsRoutes from './transactions.routes.js';

router.use('/products', productsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/transactions', transactionsRoutes);

export default router;
