import { Router } from 'express';
import { createOrder, getOrder, updateOrderStatus } from '../controllers/order.controller';

const router = Router();

router.post('/', createOrder);
router.get('/:id', getOrder);
router.patch('/:id/status', updateOrderStatus);

export default router;
