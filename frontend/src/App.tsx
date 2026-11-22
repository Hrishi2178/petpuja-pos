import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  ChefHat,
  Grid2x2,
  Package,
  RefreshCw,
  ShoppingCart,
  UtensilsCrossed,
} from 'lucide-react';
import { posApi } from './api';
import { AnalyticsView } from './components/AnalyticsView';
import { InventoryView } from './components/InventoryView';
import { KOTView } from './components/KOTView';
import { MenuView } from './components/MenuView';
import { POSView } from './components/POSView';
import { ReceiptModal } from './components/ReceiptModal';
import { TablesView } from './components/TablesView';
import type { AnalyticsData, DiningTable, InventoryItem, MenuItem, Order } from './types';

type Tab = 'pos' | 'kot' | 'tables' | 'menu' | 'inventory' | 'analytics';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('pos');
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [preselectedTableId, setPreselectedTableId] = useState<number | null>(null);

  const loadAll = useCallback(async () => {
    setApiError('');
    try {
      const [m, t, o, inv, an] = await Promise.all([
        posApi.getMenu(),
        posApi.getTables(),
        posApi.getOrders(),
        posApi.getInventory(),
        posApi.getAnalytics(),
      ]);
      setMenu(m);
      setTables(t);
      setOrders(o);
      setInventory(inv);
      setAnalytics(an);
    } catch {
      setApiError('Unable to connect to the FastAPI backend. Ensure Uvicorn is running on VITE_API_URL.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const activeKOTCount = orders.filter((o) => o.kot_status !== 'served').length;
  const lowStockCount = inventory.filter((i) => i.quantity <= i.min_threshold).length;

  const navItems: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'pos', label: 'POS Billing', icon: <ShoppingCart className="h-4 w-4" /> },
    { id: 'kot', label: 'KOT Kitchen', icon: <ChefHat className="h-4 w-4" />, badge: activeKOTCount },
    { id: 'tables', label: 'Tables', icon: <Grid2x2 className="h-4 w-4" /> },
    { id: 'menu', label: 'Menu', icon: <UtensilsCrossed className="h-4 w-4" /> },
    { id: 'inventory', label: 'Inventory', icon: <Package className="h-4 w-4" />, badge: lowStockCount },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 text-white font-bold shadow-sm">
              PP
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-none">PetPuja POS</h1>
              <p className="text-[11px] text-slate-500">Restaurant Billing & Kitchen Suite</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                  activeTab === item.id
                    ? 'bg-orange-50 text-orange-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item.icon}
                {item.label}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="rounded-full bg-orange-600 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <button
            onClick={loadAll}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>

        {/* Mobile Nav */}
        <div className="flex md:hidden overflow-x-auto border-t border-slate-100 px-3 py-2 gap-1.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                activeTab === item.id ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 sm:px-6 py-6">
        {apiError && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {apiError}
          </div>
        )}

        {activeTab === 'pos' && (
          <POSView
            menu={menu}
            tables={tables}
            preselectedTableId={preselectedTableId}
            onClearPreselectedTable={() => setPreselectedTableId(null)}
            onOrderCreated={(order) => {
              setReceiptOrder(order);
              loadAll();
            }}
          />
        )}

        {activeTab === 'kot' && <KOTView orders={orders} onRefresh={loadAll} />}

        {activeTab === 'tables' && (
          <TablesView
            tables={tables}
            orders={orders}
            onStartOrderForTable={(id) => {
              setPreselectedTableId(id);
              setActiveTab('pos');
            }}
            onOrderSettled={(order) => setReceiptOrder(order)}
            onRefresh={loadAll}
          />
        )}

        {activeTab === 'menu' && <MenuView menu={menu} onRefresh={loadAll} />}

        {activeTab === 'inventory' && <InventoryView inventory={inventory} onRefresh={loadAll} />}

        {activeTab === 'analytics' && (
          <AnalyticsView analytics={analytics} orders={orders} onViewReceipt={(o) => setReceiptOrder(o)} />
        )}
      </main>

      <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
    </div>
  );
}
