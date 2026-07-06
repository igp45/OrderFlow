import { Server } from 'socket.io';
import { MenuItem, OrderStatus } from '@prisma/client';
import prisma from '../prisma/client';
import { AppError } from '../middleware/error.middleware';
import { CreateOrderInput } from '../validators/order.validators';

export async function createOrder(input: CreateOrderInput, io: Server) {
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: input.items.map((i: { menuItemId: string; quantity: number }) => i.menuItemId) } },
  });

  if (menuItems.length !== input.items.length) {
    throw new AppError(400, 'One or more menu items not found');
  }

  const itemsWithPrice = input.items.map((item: { menuItemId: string; quantity: number }) => {
    const menuItem = menuItems.find((m: MenuItem) => m.id === item.menuItemId)!;
    return { ...item, unitPrice: menuItem.price };
  });

  const total = itemsWithPrice.reduce(
    (sum: number, item: { unitPrice: number; quantity: number }) => sum + item.unitPrice * item.quantity,
    0
  );

  const order = await prisma.order.create({
    data: {
      total,
      notes: input.notes,
      items: {
        create: itemsWithPrice.map((item: { menuItemId: string; quantity: number; unitPrice: number }) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    },
    include: {
      items: { include: { menuItem: true } },
    },
  });

  io.emit('order:new', order);

  return order;
}

export async function getOrderById(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { menuItem: true } } },
  });

  if (!order) throw new AppError(404, 'Order not found');
  return order;
}

export async function updateOrderStatus(id: string, status: OrderStatus, io: Server) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new AppError(404, 'Order not found');

  const updated = await prisma.order.update({
    where: { id },
    data: { status },
    include: { items: { include: { menuItem: true } } },
  });

  io.emit('order:statusUpdated', updated);

  return updated;
}
