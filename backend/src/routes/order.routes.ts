import { Router } from 'express';
import { createOrder, getOrder, updateOrderStatus, getActiveOrders, getAllOrders } from '../controllers/order.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', requireAuth('admin'), getAllOrders);
router.get('/active', requireAuth('admin', 'kitchen'), getActiveOrders);
router.post('/', createOrder);
router.get('/:id', getOrder);
router.patch('/:id/status', requireAuth('admin', 'kitchen'), updateOrderStatus);

export default router;
