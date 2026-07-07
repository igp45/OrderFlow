import { Router } from 'express';
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem } from '../controllers/menu.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getMenu);
router.post('/', requireAuth('admin'), createMenuItem);
router.patch('/:id', requireAuth('admin'), updateMenuItem);
router.delete('/:id', requireAuth('admin'), deleteMenuItem);

export default router;
