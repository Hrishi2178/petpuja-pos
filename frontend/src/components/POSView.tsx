import React, { useMemo, useState } from 'react';
import { Minus, Plus, Search, ShoppingBag, Trash2, UtensilsCrossed } from 'lucide-react';
import { formatINR, posApi } from '../api';
import type { CartEntry, DiningTable, MenuItem, Order } from '../types';

interface Props {
  menu: MenuItem[];
  tables: DiningTable[];
  preselectedTableId: number | null;
  onClearPreselectedTable: () => void;
  onOrderCreated: (order: Order) => void;
}

export const POSView: React.FC<Props> = ({
  menu,
  tables,
  preselectedTableId,
  onClearPreselectedTable,
  onOrderCreated,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [vegOnly, setVegOnly] = useState(false);

  const [cart, setCart] = useState<CartEntry[]>([]);
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in');
  const [tableId, setTableId] = useState<number | ''>(preselectedTableId ?? '');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash' | 'card'>('upi');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (preselectedTableId) {
      setOrderType('dine_in');
      setTableId(preselectedTableId);
      onClearPreselectedTable();
    }
  }, [preselectedTableId, onClearPreselectedTable]);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(menu.map((m) => m.category)))],
    [menu]
  );

  const filteredMenu = useMemo(
    () =>
      menu.filter((m) => {
        if (!m.is_available) return false;
        if (selectedCategory !== 'All' && m.category !== selectedCategory) return false;
        if (vegOnly && !m.is_veg) return false;
        if (search.trim() && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [menu, selectedCategory, vegOnly, search]
  );

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) => (c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { item, quantity: 1, notes: '' }];
    });
  };

  const updateQty = (itemId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.item.id === itemId ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const subtotal = cart.reduce((acc, c) => acc + c.item.price * c.quantity, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxable = Math.max(0, subtotal - discountAmount);
  const gstAmount = taxable * 0.05;
  const grandTotal = taxable + gstAmount;

  const submitOrder = async (payNow: boolean) => {
    setError('');
    if (cart.length === 0) {
      setError('Add at least one menu item to place an order.');
      return;
    }
    if (orderType === 'dine_in' && !tableId) {
      setError('Please select a table for Dine-In orders.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await posApi.createOrder({
        order_type: orderType,
        table_id: orderType === 'dine_in' && tableId ? Number(tableId) : null,
        customer_name: customerName || 'Walk-in Customer',
        customer_phone: customerPhone,
        discount_percent: discountPercent,
        tax_rate: 5.0,
        payment_method: payNow ? paymentMethod : 'pending',
        payment_status: payNow ? 'paid' : 'unpaid',
        notes,
        items: cart.map((c) => ({
          menu_item_id: c.item.id,
          quantity: c.quantity,
          notes: c.notes,
        })),
      });

      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscountPercent(0);
      setNotes('');
      setTableId('');
      onOrderCreated(created);
    } catch {
      setError('Failed to submit order. Check backend connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Menu Browser */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes (e.g., Paneer, Biryani, Naan)..."
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
            />
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={vegOnly}
              onChange={(e) => setVegOnly(e.target.checked)}
              className="accent-emerald-600 h-4 w-4"
            />
            Veg Only
          </label>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                selectedCategory === cat
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-orange-50 hover:text-orange-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredMenu.map((item) => {
            const inCart = cart.find((c) => c.item.id === item.id);
            return (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className={`text-left rounded-2xl border p-4 transition hover:shadow-md ${
                  inCart
                    ? 'border-orange-400 bg-orange-50/40'
                    : 'border-slate-200 bg-white hover:border-orange-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                      item.is_veg ? 'border-emerald-600' : 'border-red-600'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        item.is_veg ? 'bg-emerald-600' : 'bg-red-600'
                      }`}
                    />
                  </span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 leading-snug">{item.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-bold text-slate-900">{formatINR(item.price)}</span>
                  {inCart ? (
                    <span className="rounded-full bg-orange-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                      {inCart.quantity} in cart
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-orange-600">+ Add</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Order Cart & Billing */}
      <div className="lg:col-span-5 xl:col-span-4">
        <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-orange-400" />
              <h3 className="font-semibold">Current Bill / KOT</h3>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-slate-300 hover:text-white inline-flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>

          <div className="p-4 space-y-4">
            {/* Order Type Switcher */}
            <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1">
              {(['dine_in', 'takeaway', 'delivery'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setOrderType(t)}
                  className={`rounded-lg py-1.5 text-xs font-semibold capitalize transition ${
                    orderType === t
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Table & Customer Info */}
            <div className="grid grid-cols-2 gap-2.5">
              {orderType === 'dine_in' && (
                <select
                  value={tableId}
                  onChange={(e) => setTableId(e.target.value ? Number(e.target.value) : '')}
                  className="col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                >
                  <option value="">Select Dining Table...</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.table_number} ({t.section} • {t.capacity} seats) — {t.status.toUpperCase()}
                    </option>
                  ))}
                </select>
              )}
              <input
                type="text"
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Phone (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Cart Items */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border-y border-slate-100 py-1">
              {cart.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm">
                  <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  Tap dishes on the left to build an order
                </div>
              ) : (
                cart.map((entry) => (
                  <div key={entry.item.id} className="flex items-center justify-between py-2.5 gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{entry.item.name}</p>
                      <p className="text-xs text-slate-500">{formatINR(entry.item.price)} each</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQty(entry.item.id, -1)}
                        className="rounded-lg border border-slate-200 p-1 hover:bg-slate-100"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{entry.quantity}</span>
                      <button
                        onClick={() => updateQty(entry.item.id, 1)}
                        className="rounded-lg border border-slate-200 p-1 hover:bg-slate-100"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="w-20 text-right text-sm font-semibold text-slate-800">
                      {formatINR(entry.item.price * entry.quantity)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Notes & Discount */}
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Kitchen notes (e.g. Jain, less spicy)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-orange-500 focus:outline-none"
              />
              <div className="flex items-center rounded-xl border border-slate-200 px-2">
                <span className="text-xs text-slate-500 mr-1">Disc%</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="w-full py-1.5 text-xs text-right focus:outline-none"
                />
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-1 text-sm bg-slate-50 rounded-xl p-3">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-{formatINR(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>GST (5%)</span>
                <span>{formatINR(gstAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-slate-900 border-t border-slate-200 pt-1.5">
                <span>Total Payable</span>
                <span>{formatINR(grandTotal)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="grid grid-cols-3 gap-2">
              {(['upi', 'cash', 'card'] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`rounded-xl border py-1.5 text-xs font-semibold uppercase transition ${
                    paymentMethod === method
                      ? 'border-orange-600 bg-orange-50 text-orange-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            {error && <p className="text-xs font-medium text-red-600">{error}</p>}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                disabled={submitting}
                onClick={() => submitOrder(false)}
                className="rounded-xl border border-orange-600 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-50"
              >
                Send KOT Only
              </button>
              <button
                disabled={submitting}
                onClick={() => submitOrder(true)}
                className="rounded-xl bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
              >
                Settle & Bill
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
