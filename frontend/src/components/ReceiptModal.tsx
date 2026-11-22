import React from 'react';
import { Printer, X } from 'lucide-react';
import { formatINR } from '../api';
import type { Order } from '../types';

interface Props {
  order: Order | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<Props> = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-slate-50">
          <h3 className="font-semibold text-slate-800">Invoice & KOT Receipt</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div id="printable-receipt" className="p-6 font-mono text-sm text-slate-800 space-y-4">
          <div className="text-center border-b border-dashed border-slate-300 pb-3">
            <h2 className="text-lg font-bold tracking-wide">PETPUJA FAMILY KITCHEN</h2>
            <p className="text-xs text-slate-500">GSTIN: 27AABCP1234F1Z5</p>
            <p className="text-xs text-slate-500">
              {new Date(order.created_at).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1 text-xs border-b border-dashed border-slate-300 pb-3">
            <span>Order: <strong>{order.order_number}</strong></span>
            <span className="text-right uppercase">Type: <strong>{order.order_type.replace('_', ' ')}</strong></span>
            <span>Customer: {order.customer_name}</span>
            <span className="text-right">
              {order.table_number ? `Table: ${order.table_number}` : ''}
            </span>
          </div>

          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-300 text-left">
                <th className="pb-1.5">Item</th>
                <th className="pb-1.5 text-center">Qty</th>
                <th className="pb-1.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-1.5">{item.item_name}</td>
                  <td className="py-1.5 text-center">{item.quantity}</td>
                  <td className="py-1.5 text-right">{formatINR(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-1 border-t border-dashed border-slate-300 pt-3 text-xs">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatINR(order.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount ({order.discount_percent}%)</span>
                <span>-{formatINR(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>GST ({order.tax_rate}%)</span>
              <span>{formatINR(order.tax_amount)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-bold">
              <span>GRAND TOTAL</span>
              <span>{formatINR(order.total_amount)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-xs">
            <span>Status: <strong className="uppercase">{order.payment_status}</strong></span>
            <span>Mode: <strong className="uppercase">{order.payment_method}</strong></span>
          </div>

          <p className="text-center text-xs text-slate-500 pt-1">
            Thank you for dining with us! Visit again.
          </p>
        </div>

        <div className="flex gap-3 border-t bg-slate-50 px-5 py-3.5">
          <button
            onClick={() => window.print()}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
