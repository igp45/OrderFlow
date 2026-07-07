import { Router } from 'express';
import { createOrder, getOrder, updateOrderStatus, getActiveOrders, getAllOrders } from '../controllers/order.controller';

const router = Router();

router.get('/', getAllOrders);
router.get('/active', getActiveOrders);
router.post('/', createOrder);
router.get('/:id', getOrder);
router.patch('/:id/status', updateOrderStatus);

export default router;
