export interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  is_veg: boolean;
  is_available: boolean;
  description: string;
}

export interface DiningTable {
  id: number;
  table_number: string;
  section: string;
  capacity: number;
  status: 'available' | 'occupied' | 'billed';
  active_order_id: number | null;
}

export interface OrderItem {
  id: number;
  menu_item_id: number | null;
  item_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  notes: string;
}

export interface Order {
  id: number;
  order_number: string;
  order_type: 'dine_in' | 'takeaway' | 'delivery';
  table_id: number | null;
  table_number: string | null;
  customer_name: string;
  customer_phone: string;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  payment_method: 'cash' | 'upi' | 'card' | 'pending';
  payment_status: 'unpaid' | 'paid';
  kot_status: 'pending' | 'preparing' | 'ready' | 'served';
  notes: string;
  created_at: string;
  items: OrderItem[];
}

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  min_threshold: number;
  cost_per_unit: number;
  updated_at: string;
}

export interface AnalyticsData {
  total_revenue: number;
  pending_revenue: number;
  total_orders: number;
  paid_orders: number;
  avg_order_value: number;
  active_kots: number;
  occupied_tables: number;
  total_tables: number;
  low_stock_count: number;
  payment_breakdown: Record<string, number>;
  order_type_counts: Record<string, number>;
  top_items: { name: string; quantity: number; revenue: number }[];
}

export interface CartEntry {
  item: MenuItem;
  quantity: number;
  notes: string;
}
