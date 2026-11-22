import React, { useState } from 'react';
import { AlertTriangle, Minus, Plus, Trash2 } from 'lucide-react';
import { formatINR, posApi } from '../api';
import type { InventoryItem } from '../types';

interface Props {
  inventory: InventoryItem[];
  onRefresh: () => void;
}

export const InventoryView: React.FC<Props> = ({ inventory, onRefresh }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Produce');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [minThreshold, setMinThreshold] = useState('5');
  const [costPerUnit, setCostPerUnit] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !quantity) return;
    await posApi.createInventoryItem({
      name: name.trim(),
      category: category.trim(),
      quantity: Number(quantity),
      unit,
      min_threshold: Number(minThreshold || 0),
      cost_per_unit: Number(costPerUnit || 0),
    });
    setName('');
    setQuantity('');
    setCostPerUnit('');
    onRefresh();
  };

  const adjust = async (id: number, delta: number) => {
    await posApi.adjustInventory(id, delta);
    onRefresh();
  };

  const remove = async (id: number) => {
    await posApi.deleteInventoryItem(id);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-7 gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <input
          type="text"
          required
          placeholder="Ingredient Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          type="number"
          step="0.5"
          required
          placeholder="Stock Qty"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="kg">kg</option>
          <option value="L">L</option>
          <option value="pcs">pcs</option>
          <option value="g">g</option>
        </select>
        <input
          type="number"
          step="0.5"
          placeholder="Min Alert"
          value={minThreshold}
          onChange={(e) => setMinThreshold(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" /> Add Stock
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3.5">Ingredient</th>
              <th className="px-5 py-3.5">Category</th>
              <th className="px-5 py-3.5">Current Stock</th>
              <th className="px-5 py-3.5">Min Threshold</th>
              <th className="px-5 py-3.5">Unit Cost</th>
              <th className="px-5 py-3.5 text-center">Quick Adjust</th>
              <th className="px-5 py-3.5 text-right">Remove</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inventory.map((item) => {
              const isLow = item.quantity <= item.min_threshold;
              return (
                <tr key={item.id} className={isLow ? 'bg-red-50/40' : 'hover:bg-slate-50/70'}>
                  <td className="px-5 py-3.5 font-semibold text-slate-900 flex items-center gap-2">
                    {item.name}
                    {isLow && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                        <AlertTriangle className="h-3 w-3" /> Low Stock
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{item.category}</td>
                  <td className={`px-5 py-3.5 font-bold ${isLow ? 'text-red-600' : 'text-slate-900'}`}>
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {item.min_threshold} {item.unit}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{formatINR(item.cost_per_unit)}/{item.unit}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => adjust(item.id, -1)}
                        className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium hover:bg-slate-100"
                      >
                        <Minus className="h-3 w-3" /> 1
                      </button>
                      <button
                        onClick={() => adjust(item.id, 1)}
                        className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium hover:bg-slate-100"
                      >
                        <Plus className="h-3 w-3" /> 1
                      </button>
                      <button
                        onClick={() => adjust(item.id, 5)}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        +5
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => remove(item.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
