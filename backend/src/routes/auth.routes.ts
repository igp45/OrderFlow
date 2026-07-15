import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { verifyPassword } from '../services/settings.service';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';
const COOKIE_NAME = 'of_token';

// Safari < 13 and iOS < 13 mishandle SameSite=None — they reject it entirely.
// For those browsers, omit SameSite so the browser uses its default (works for same-site,
// and cross-site with CORS credentials still functions on those old versions).
function shouldSendSameSiteNone(ua: string): boolean {
  if (/CPU iPhone OS 1[012]_/.test(ua)) return false;   // iOS 10/11/12
  if (/iPad; CPU OS 1[012]_/.test(ua)) return false;    // iPadOS 10/11/12
  if (/Macintosh;.+Version\/1[012]\..+Safari/.test(ua)) return false; // macOS Safari 10/11/12
  if (/Chrome\/5[0-9]\./.test(ua) || /Chrome\/6[0-6]\./.test(ua)) return false; // Chrome 50–66
  return true;
}

function cookieOpts(isProd: boolean, ua = '') {
  const sameSite = isProd && shouldSendSameSiteNone(ua)
    ? ('none' as const)
    : ('lax' as const);
  return {
    httpOnly: true,
    secure: isProd,
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

router.post('/login', async (req: Request, res: Response) => {
  const { role, password } = req.body as { role?: string; password?: string };
  const isProd = process.env.NODE_ENV === 'production';

  if (!role || !['admin', 'kitchen'].includes(role) || !password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await verifyPassword(role as 'admin' | 'kitchen', password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ role }, JWT_SECRET, { expiresIn: '7d' });
  const ua = req.headers['user-agent'] ?? '';
  res.cookie(COOKIE_NAME, token, cookieOpts(isProd, ua));
  return res.json({ role });
});

router.post('/logout', (req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production';
  const ua = req.headers['user-agent'] ?? '';
  res.clearCookie(COOKIE_NAME, cookieOpts(isProd, ua));
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
