import React from 'react';
import { IndianRupee, Receipt, ShoppingBag, TrendingUp } from 'lucide-react';
import { formatINR } from '../api';
import type { AnalyticsData, Order } from '../types';

interface Props {
  analytics: AnalyticsData | null;
  orders: Order[];
  onViewReceipt: (order: Order) => void;
}

export const AnalyticsView: React.FC<Props> = ({ analytics, orders, onViewReceipt }) => {
  if (!analytics) {
    return <p className="text-sm text-slate-500">Loading analytics...</p>;
  }

  const totalPayments = Object.values(analytics.payment_breakdown).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Settled Revenue</span>
            <IndianRupee className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatINR(analytics.total_revenue)}</p>
          <p className="mt-1 text-xs text-slate-500">
            Unpaid open bills: {formatINR(analytics.pending_revenue)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Orders</span>
            <ShoppingBag className="h-4 w-4 text-orange-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{analytics.total_orders}</p>
          <p className="mt-1 text-xs text-slate-500">{analytics.paid_orders} settled • {analytics.active_kots} active KOTs</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Average Order Value</span>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatINR(analytics.avg_order_value)}</p>
          <p className="mt-1 text-xs text-slate-500">Across settled invoices</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Floor & Stock Health</span>
            <Receipt className="h-4 w-4 text-purple-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {analytics.occupied_tables}/{analytics.total_tables} Tables
          </p>
          <p className="mt-1 text-xs text-red-600 font-medium">
            {analytics.low_stock_count} inventory items below threshold
          </p>
        </div>
      </div>

      {/* Payment Breakdown & Top Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900">Payment Mode Breakdown</h3>
          {Object.keys(analytics.payment_breakdown).length === 0 ? (
            <p className="text-sm text-slate-400">No settled payments yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(analytics.payment_breakdown).map(([mode, amount]) => {
                const pct = Math.round((amount / totalPayments) * 100);
                return (
                  <div key={mode} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium uppercase text-slate-700">{mode}</span>
                      <span className="font-semibold text-slate-900">
                        {formatINR(amount)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-orange-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900">Top Selling Dishes</h3>
          <div className="divide-y divide-slate-100">
            {analytics.top_items.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between py-2.5 text-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-slate-800">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-900">{formatINR(item.revenue)}</span>
                  <span className="ml-2 text-xs text-slate-500">({item.quantity} sold)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-900">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Order #</th>
                <th className="px-5 py-3">Customer / Table</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">KOT</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.slice(0, 15).map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3 font-semibold text-slate-900">{o.order_number}</td>
                  <td className="px-5 py-3 text-slate-700">
                    {o.customer_name} {o.table_number ? `(${o.table_number})` : ''}
                  </td>
                  <td className="px-5 py-3 capitalize text-slate-600">{o.order_type.replace('_', ' ')}</td>
                  <td className="px-5 py-3 uppercase text-xs font-semibold text-slate-600">{o.kot_status}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                        o.payment_status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {o.payment_status} ({o.payment_method})
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">{formatINR(o.total_amount)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => onViewReceipt(o)}
                      className="text-xs font-semibold text-orange-600 hover:underline"
                    >
                      View Bill
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
