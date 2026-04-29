import { Router } from 'express';
import {
    iniciarPago,
    webhook,
    verifyPayment,
    sendEmail,
    updateTransaction,
    consultarEstadoPlexo,
} from '../controllers/payment.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// ─── Endpoints Plexo ───────────────────────────────────────────────────────

// Inicia el checkout — requiere auth (el usuario debe estar logueado o es llamada pública desde FE)
router.post('/payment', iniciarPago);

// Webhook de Plexo — SIN auth (Plexo no envía JWT)
router.post('/webhook', webhook);

// El frontend consulta si la transacción fue aprobada
router.get('/verify-payment', verifyPayment);

// Dispara emails de confirmación al cliente e interno
router.get('/send-email', sendEmail);

// Actualización manual del estado (admin)
router.post('/update-tran', authMiddleware, updateTransaction);

// Consulta el estado directamente en Plexo (admin)
router.post('/check-transaction', authMiddleware, consultarEstadoPlexo);

export default router;
