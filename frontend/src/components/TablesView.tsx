import React, { useState } from 'react';
import { Plus, Receipt, Users } from 'lucide-react';
import { formatINR, posApi } from '../api';
import type { DiningTable, Order } from '../types';

interface Props {
  tables: DiningTable[];
  orders: Order[];
  onStartOrderForTable: (tableId: number) => void;
  onOrderSettled: (order: Order) => void;
  onRefresh: () => void;
}

export const TablesView: React.FC<Props> = ({
  tables,
  orders,
  onStartOrderForTable,
  onOrderSettled,
  onRefresh,
}) => {
  const [sectionFilter, setSectionFilter] = useState('All');
  const [newNumber, setNewNumber] = useState('');
  const [newSection, setNewSection] = useState('Main Hall');
  const [newCapacity, setNewCapacity] = useState(4);
  const [settleMethod, setSettleMethod] = useState<Record<number, 'upi' | 'cash' | 'card'>>({});

  const sections = ['All', ...Array.from(new Set(tables.map((t) => t.section)))];
  const filtered = sectionFilter === 'All' ? tables : tables.filter((t) => t.section === sectionFilter);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber.trim()) return;
    await posApi.createTable({ table_number: newNumber.trim(), section: newSection, capacity: newCapacity });
    setNewNumber('');
    onRefresh();
  };

  const handleSettle = async (orderId: number, tableId: number) => {
    const method = settleMethod[tableId] || 'upi';
    const settled = await posApi.settleOrder(orderId, method);
    onOrderSettled(settled);
    onRefresh();
  };

  const handleFreeTable = async (tableId: number) => {
    await posApi.updateTable(tableId, { status: 'available' });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {sections.map((s) => (
            <button
              key={s}
              onClick={() => setSectionFilter(s)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                sectionFilter === s
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-orange-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <form onSubmit={handleAddTable} className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
          <input
            type="text"
            placeholder="Table # (e.g. T5)"
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
            className="w-32 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
          />
          <input
            type="text"
            placeholder="Section"
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
            className="w-28 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
          />
          <input
            type="number"
            min={1}
            max={20}
            value={newCapacity}
            onChange={(e) => setNewCapacity(Number(e.target.value))}
            className="w-16 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600"
          >
            <Plus className="h-4 w-4" /> Add Table
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((table) => {
          const activeOrder = orders.find((o) => o.id === table.active_order_id);
          const isOccupied = table.status !== 'available';

          return (
            <div
              key={table.id}
              className={`rounded-2xl border p-5 shadow-sm transition space-y-4 ${
                isOccupied ? 'border-orange-300 bg-orange-50/40' : 'border-emerald-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xl font-bold text-slate-900">{table.table_number}</h4>
                  <p className="text-xs text-slate-500">{table.section}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${
                    isOccupied ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {table.status}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Users className="h-4 w-4 text-slate-400" />
                <span>Capacity: {table.capacity} guests</span>
              </div>

              {activeOrder ? (
                <div className="rounded-xl bg-white border border-orange-200 p-3 space-y-2.5 text-xs">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>{activeOrder.order_number}</span>
                    <span>{formatINR(activeOrder.total_amount)}</span>
                  </div>
                  <p className="text-slate-500">
                    {activeOrder.items.length} items • KOT: <strong className="uppercase">{activeOrder.kot_status}</strong>
                  </p>
                  <div className="flex gap-1.5">
                    <select
                      value={settleMethod[table.id] || 'upi'}
                      onChange={(e) =>
                        setSettleMethod((prev) => ({
                          ...prev,
                          [table.id]: e.target.value as 'upi' | 'cash' | 'card',
                        }))
                      }
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs uppercase"
                    >
                      <option value="upi">UPI</option>
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                    </select>
                    <button
                      onClick={() => handleSettle(activeOrder.id, table.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-orange-600 py-1.5 font-semibold text-white hover:bg-orange-700"
                    >
                      <Receipt className="h-3.5 w-3.5" /> Settle Bill
                    </button>
                  </div>
                </div>
              ) : isOccupied ? (
                <button
                  onClick={() => handleFreeTable(table.id)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Mark Available
                </button>
              ) : (
                <button
                  onClick={() => onStartOrderForTable(table.id)}
                  className="w-full rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition"
                >
                  Start New Order
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
