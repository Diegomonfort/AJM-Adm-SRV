import { Router } from 'express';
import { getStoreProductos, getStoreCategorias, getStoreProductoDetalle, getStoreDestacados } from '../controllers/store.controller.js';

const router = Router();

// Soporte para ambos nombres (español e inglés) para evitar 404 en el frontend actual
router.get('/productos', getStoreProductos);
router.get('/products', getStoreProductos);

router.get('/destacados', getStoreDestacados);
router.get('/featured', getStoreDestacados);

router.get('/productos/:id', getStoreProductoDetalle);
router.get('/products/:id', getStoreProductoDetalle);

router.get('/categorias', getStoreCategorias);
router.get('/categories', getStoreCategorias);

export default router;
