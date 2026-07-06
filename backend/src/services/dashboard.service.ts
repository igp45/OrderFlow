import prisma from '../prisma/client';

export async function getDashboardStats() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [revenueToday, totalOrders, activeOrders, completedOrders, topItems] = await Promise.all([
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfDay } },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.order.count({
      where: {
        status: { in: ['PENDING', 'PREPARING', 'READY'] },
        createdAt: { gte: startOfDay },
      },
    }),
    prisma.order.count({
      where: { status: 'COMPLETED', createdAt: { gte: startOfDay } },
    }),
    prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: { order: { createdAt: { gte: startOfDay } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ]);

  const topItemsWithDetails = await Promise.all(
    topItems.map(async (item: { menuItemId: string; _sum: { quantity: number | null } }) => {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
      });
      return { menuItem, totalSold: item._sum.quantity };
    })
  );

  return {
    revenueToday: revenueToday._sum.total ?? 0,
    totalOrders,
    activeOrders,
    completedOrders,
    topItems: topItemsWithDetails,
  };
}
