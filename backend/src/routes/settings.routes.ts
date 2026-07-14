import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getPaymentDetails, getSetting, setSetting, changePassword } from '../services/settings.service';

const router = Router();

router.get('/payment', async (_req: Request, res: Response) => {
  const details = await getPaymentDetails();
  res.json(details);
});

router.patch('/payment', requireAuth('admin'), async (req: Request, res: Response) => {
  const { bankName, accountName, accountNumber } = req.body as {
    bankName?: string; accountName?: string; accountNumber?: string;
  };
  await Promise.all([
    bankName !== undefined && setSetting('bank_name', bankName),
    accountName !== undefined && setSetting('account_name', accountName),
    accountNumber !== undefined && setSetting('account_number', accountNumber),
  ]);
  res.json(await getPaymentDetails());
});

router.get('/status', async (_req: Request, res: Response) => {
  const val = await getSetting('restaurant_open');
  res.json({ isOpen: val !== 'false' });
});

router.patch('/status', requireAuth('admin'), async (req: Request, res: Response) => {
  const { isOpen } = req.body as { isOpen?: boolean };
  if (typeof isOpen !== 'boolean') return res.status(400).json({ error: 'isOpen must be a boolean' });
  await setSetting('restaurant_open', isOpen ? 'true' : 'false');
  return res.json({ isOpen });
});

router.patch('/passwords', requireAuth('admin'), async (req: Request, res: Response) => {
  const { role, newPassword } = req.body as { role?: string; newPassword?: string };
  if (!role || !['admin', 'kitchen'].includes(role)) {
    return res.status(400).json({ error: 'Role must be admin or kitchen' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  await changePassword(role as 'admin' | 'kitchen', newPassword);
  return res.json({ ok: true });
});

export default router;
