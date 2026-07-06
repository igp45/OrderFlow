export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  available: boolean;
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  menuItemId: string;
  menuItem: MenuItem;
}

export interface Order {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface DashboardStats {
  revenueToday: number;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  topItems: { menuItem: MenuItem; totalSold: number }[];
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}
