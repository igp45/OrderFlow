import prisma from '../prisma/client';
import { AppError } from '../middleware/error.middleware';
import { CreateMenuItemInput, UpdateMenuItemInput } from '../validators/menu.validators';

export async function getAllMenuItems() {
  return prisma.menuItem.findMany({ orderBy: { category: 'asc' } });
}

export async function createMenuItem(data: CreateMenuItemInput) {
  return prisma.menuItem.create({ data });
}

export async function updateMenuItem(id: string, data: UpdateMenuItemInput) {
  const item = await prisma.menuItem.findUnique({ where: { id } });
  if (!item) throw new AppError(404, 'Menu item not found');
  return prisma.menuItem.update({ where: { id }, data });
}

export async function deleteMenuItem(id: string) {
  const item = await prisma.menuItem.findUnique({ where: { id } });
  if (!item) throw new AppError(404, 'Menu item not found');
  return prisma.menuItem.delete({ where: { id } });
}
