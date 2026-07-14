import axios from 'axios';
import type { MenuItem, Order, DashboardStats } from '../types';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/',
  withCredentials: true,
  timeout: 65000,
});

// Fire-and-forget ping to wake the Render backend from cold-start sleep
export const warmUp = () => api.get('/health').catch(() => {});

export const authApi = {
  login: (role: string, password: string) =>
    api.post<{ role: string }>('/auth/login', { role, password }).then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data),
  me: () => api.get<{ role: string }>('/auth/me').then(r => r.data),
};

export const menuApi = {
  getAll: () => api.get<MenuItem[]>('/menu').then(r => r.data),
  create: (data: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<MenuItem>('/menu', data).then(r => r.data),
  update: (id: string, data: Partial<MenuItem>) =>
    api.patch<MenuItem>(`/menu/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/menu/${id}`),
};

export const ordersApi = {
  create: (payload: { items: { menuItemId: string; quantity: number }[]; notes?: string }) =>
    api.post<Order>('/orders', payload).then(r => r.data),
  getById: (id: string) => api.get<Order>(`/orders/${id}`).then(r => r.data),
  updateStatus: (id: string, status: string) =>
    api.patch<Order>(`/orders/${id}/status`, { status }).then(r => r.data),
  getActive: () => api.get<Order[]>('/orders/active').then(r => r.data),
  getAll: (status?: string) =>
    api.get<Order[]>('/orders', { params: status ? { status } : {} }).then(r => r.data),
};

export const dashboardApi = {
  getStats: () => api.get<DashboardStats>('/dashboard').then(r => r.data),
};

export const aiApi = {
  predict: () => api.post<Record<string, number>>('/ai/predict').then(r => r.data),
};

export interface PaymentDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export const settingsApi = {
  getPayment: () => api.get<PaymentDetails>('/settings/payment').then(r => r.data),
  updatePayment: (data: Partial<PaymentDetails>) =>
    api.patch<PaymentDetails>('/settings/payment', data).then(r => r.data),
  changePassword: (role: 'admin' | 'kitchen', newPassword: string) =>
    api.patch('/settings/passwords', { role, newPassword }).then(r => r.data),
  getStatus: () => api.get<{ isOpen: boolean }>('/settings/status').then(r => r.data),
  setStatus: (isOpen: boolean) =>
    api.patch<{ isOpen: boolean }>('/settings/status', { isOpen }).then(r => r.data),
};
