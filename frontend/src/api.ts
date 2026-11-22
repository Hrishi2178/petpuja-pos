import axios from 'axios';
import type { AnalyticsData, DiningTable, InventoryItem, MenuItem, Order } from './types';

const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

export const formatINR = (amount: number): string =>
  `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const posApi = {
  // Menu
  getMenu: () => api.get<MenuItem[]>('/api/menu').then((r) => r.data),
  createMenuItem: (data: Omit<MenuItem, 'id'>) => api.post<MenuItem>('/api/menu', data).then((r) => r.data),
  updateMenuItem: (id: number, data: Partial<MenuItem>) => api.patch<MenuItem>(`/api/menu/${id}`, data).then((r) => r.data),
  deleteMenuItem: (id: number) => api.delete(`/api/menu/${id}`).then((r) => r.data),

  // Tables
  getTables: () => api.get<DiningTable[]>('/api/tables').then((r) => r.data),
  createTable: (data: { table_number: string; section: string; capacity: number }) =>
    api.post<DiningTable>('/api/tables', data).then((r) => r.data),
  updateTable: (id: number, data: Partial<DiningTable>) =>
    api.patch<DiningTable>(`/api/tables/${id}`, data).then((r) => r.data),

  // Orders & KOT
  getOrders: () => api.get<Order[]>('/api/orders').then((r) => r.data),
  getKOT: () => api.get<Order[]>('/api/kot').then((r) => r.data),
  createOrder: (payload: {
    order_type: string;
    table_id: number | null;
    customer_name: string;
    customer_phone: string;
    discount_percent: number;
    tax_rate: number;
    payment_method: string;
    payment_status: string;
    notes: string;
    items: { menu_item_id: number; quantity: number; notes: string }[];
  }) => api.post<Order>('/api/orders', payload).then((r) => r.data),
  updateKOTStatus: (id: number, kot_status: Order['kot_status']) =>
    api.patch<Order>(`/api/orders/${id}/kot-status`, { kot_status }).then((r) => r.data),
  settleOrder: (id: number, payment_method: 'cash' | 'upi' | 'card') =>
    api.patch<Order>(`/api/orders/${id}/settle`, { payment_method }).then((r) => r.data),

  // Inventory
  getInventory: () => api.get<InventoryItem[]>('/api/inventory').then((r) => r.data),
  createInventoryItem: (data: Omit<InventoryItem, 'id' | 'updated_at'>) =>
    api.post<InventoryItem>('/api/inventory', data).then((r) => r.data),
  adjustInventory: (id: number, delta: number) =>
    api.post<InventoryItem>(`/api/inventory/${id}/adjust`, { delta }).then((r) => r.data),
  deleteInventoryItem: (id: number) => api.delete(`/api/inventory/${id}`).then((r) => r.data),

  // Analytics
  getAnalytics: () => api.get<AnalyticsData>('/api/analytics').then((r) => r.data),
};
