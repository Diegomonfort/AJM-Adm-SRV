import { Router } from 'express';
import multer from 'multer';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categories.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', authMiddleware, getCategories);
router.post('/', authMiddleware, upload.single('imagen'), createCategory);
router.put('/:id', authMiddleware, upload.single('imagen'), updateCategory);
router.delete('/:id', authMiddleware, deleteCategory);

export default router;
