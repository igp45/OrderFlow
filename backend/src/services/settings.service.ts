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
  // Env var always works as a master override (useful for resets)
  const envPass = role === 'admin' ? process.env.ADMIN_PASSWORD : process.env.KITCHEN_PASSWORD;
  if (envPass && password === envPass) {
    // Store/overwrite the hash in DB so future logins use bcrypt
    await setSetting(`${role}_password_hash`, await bcrypt.hash(password, 10));
    return true;
  }
  // Otherwise verify against the stored bcrypt hash
  const hash = await getSetting(`${role}_password_hash`);
  if (hash) return bcrypt.compare(password, hash);
  return false;
}

export async function changePassword(role: 'admin' | 'kitchen', newPassword: string): Promise<void> {
  const hash = await bcrypt.hash(newPassword, 10);
  await setSetting(`${role}_password_hash`, hash);
}
