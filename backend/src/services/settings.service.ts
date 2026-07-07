import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function getSetting(key: string): Promise<string | null> {
  const s = await prisma.setting.findUnique({ where: { key } });
  return s?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function getPaymentDetails() {
  const [bankName, accountName, accountNumber] = await Promise.all([
    getSetting('bank_name'),
    getSetting('account_name'),
    getSetting('account_number'),
  ]);
  return {
    bankName: bankName ?? '',
    accountName: accountName ?? '',
    accountNumber: accountNumber ?? '',
  };
}

export async function verifyPassword(role: 'admin' | 'kitchen', password: string): Promise<boolean> {
  const hash = await getSetting(`${role}_password_hash`);
  if (hash) {
    return bcrypt.compare(password, hash);
  }
  // First-deploy fallback: check env var and auto-migrate to DB hash
  const envPass = role === 'admin' ? process.env.ADMIN_PASSWORD : process.env.KITCHEN_PASSWORD;
  if (password === envPass) {
    const newHash = await bcrypt.hash(password, 10);
    await setSetting(`${role}_password_hash`, newHash);
    return true;
  }
  return false;
}

export async function changePassword(role: 'admin' | 'kitchen', newPassword: string): Promise<void> {
  const hash = await bcrypt.hash(newPassword, 10);
  await setSetting(`${role}_password_hash`, hash);
}
