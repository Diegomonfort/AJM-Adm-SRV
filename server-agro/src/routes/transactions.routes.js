import { Router } from 'express';
import { getTransactions } from '../controllers/transactions.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, getTransactions);

export default router;
