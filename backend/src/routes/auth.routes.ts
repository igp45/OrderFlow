import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';
const COOKIE_NAME = 'of_token';

function cookieOpts(isProd: boolean) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

router.post('/login', (req: Request, res: Response) => {
  const { role, password } = req.body as { role?: string; password?: string };
  const isProd = process.env.NODE_ENV === 'production';

  const passwords: Record<string, string> = {
    admin: process.env.ADMIN_PASSWORD || '',
    kitchen: process.env.KITCHEN_PASSWORD || '',
  };

  if (!role || !passwords[role] || password !== passwords[role]) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ role }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE_NAME, token, cookieOpts(isProd));
  return res.json({ role });
});

router.post('/logout', (req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie(COOKIE_NAME, cookieOpts(isProd));
  res.json({ ok: true });
});

router.get('/me', (req: Request, res: Response) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { role: string };
    return res.json({ role: payload.role });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
