import { Router } from 'express';
import multer from 'multer';
import { getProductsByShop, getProductSpecs, upsertProductSpecs, deleteProductSpec, createProduct, updateProduct, deleteProduct } from '../controllers/products.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// GET /api/products?shop=husqvarna o GET /api/products?shop=stihl
router.get('/', authMiddleware, getProductsByShop);

// POST /api/products
router.post('/', authMiddleware, upload.fields([{ name: 'imagen', maxCount: 1 }, { name: 'destacados_img', maxCount: 1 }]), createProduct);
router.put('/:id', authMiddleware, upload.fields([{ name: 'imagen', maxCount: 1 }, { name: 'destacados_img', maxCount: 1 }]), updateProduct);
router.delete('/:id', authMiddleware, deleteProduct);

// Rutas para product_specs
router.get('/:id/specs', authMiddleware, getProductSpecs);
router.post('/:id/specs', authMiddleware, upsertProductSpecs);
// También puedes usar PUT, pero POST con upsert funciona bien para crear/modificar
router.delete('/:id/specs/:specId', authMiddleware, deleteProductSpec);

export default router;
