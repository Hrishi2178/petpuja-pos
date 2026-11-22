import React from 'react';
import { CheckCircle2, ChefHat, Clock, Flame } from 'lucide-react';
import { posApi } from '../api';
import type { Order } from '../types';

interface Props {
  orders: Order[];
  onRefresh: () => void;
}

const COLUMNS: {
  key: Order['kot_status'];
  title: string;
  next: Order['kot_status'] | null;
  nextLabel: string;
  badgeClass: string;
}[] = [
  { key: 'pending', title: 'New KOTs', next: 'preparing', nextLabel: 'Start Preparing', badgeClass: 'bg-amber-100 text-amber-800' },
  { key: 'preparing', title: 'Preparing', next: 'ready', nextLabel: 'Mark Ready', badgeClass: 'bg-blue-100 text-blue-800' },
  { key: 'ready', title: 'Ready to Serve', next: 'served', nextLabel: 'Mark Served', badgeClass: 'bg-emerald-100 text-emerald-800' },
  { key: 'served', title: 'Served (Recent)', next: null, nextLabel: '', badgeClass: 'bg-slate-100 text-slate-700' },
];

export const KOTView: React.FC<Props> = ({ orders, onRefresh }) => {
  const advanceStatus = async (orderId: number, nextStatus: Order['kot_status']) => {
    await posApi.updateKOTStatus(orderId, nextStatus);
    onRefresh();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      {COLUMNS.map((col) => {
        const colOrders = orders.filter((o) => o.kot_status === col.key);
        return (
          <div key={col.key} className="rounded-2xl border border-slate-200 bg-slate-100/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {col.key === 'pending' && <Clock className="h-4 w-4 text-amber-600" />}
                {col.key === 'preparing' && <Flame className="h-4 w-4 text-blue-600" />}
                {col.key === 'ready' && <ChefHat className="h-4 w-4 text-emerald-600" />}
                {col.key === 'served' && <CheckCircle2 className="h-4 w-4 text-slate-500" />}
                <h3 className="font-semibold text-slate-800">{col.title}</h3>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${col.badgeClass}`}>
                {colOrders.length}
              </span>
            </div>

            <div className="space-y-3">
              {colOrders.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white/60 py-8 text-center text-xs text-slate-400">
                  No tickets here
                </p>
              ) : (
                colOrders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{order.order_number}</span>
                        <p className="text-xs text-slate-500">
                          {order.table_number ? `Table ${order.table_number}` : order.order_type.toUpperCase()} • {order.customer_name}
                        </p>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <ul className="space-y-1.5 border-y border-slate-100 py-2 text-sm">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex justify-between">
                          <span className="text-slate-700">{item.item_name}</span>
                          <span className="font-bold text-slate-900">x{item.quantity}</span>
                        </li>
                      ))}
                    </ul>

                    {order.notes && (
                      <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">
                        Note: {order.notes}
                      </p>
                    )}

                    {col.next && (
                      <button
                        onClick={() => advanceStatus(order.id, col.next!)}
                        className="w-full rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition"
                      >
                        {col.nextLabel}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
