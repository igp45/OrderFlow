import prisma from '../prisma/client';

export async function getAllMenuItems() {
  return prisma.menuItem.findMany({
    where: { available: true },
    orderBy: { category: 'asc' },
  });
}
