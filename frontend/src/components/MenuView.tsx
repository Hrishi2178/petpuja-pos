import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatINR, posApi } from '../api';
import type { MenuItem } from '../types';

interface Props {
  menu: MenuItem[];
  onRefresh: () => void;
}

export const MenuView: React.FC<Props> = ({ menu, onRefresh }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Main Course');
  const [price, setPrice] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [description, setDescription] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;
    await posApi.createMenuItem({
      name: name.trim(),
      category: category.trim(),
      price: Number(price),
      is_veg: isVeg,
      is_available: true,
      description: description.trim(),
    });
    setName('');
    setPrice('');
    setDescription('');
    onRefresh();
  };

  const toggleAvailability = async (item: MenuItem) => {
    await posApi.updateMenuItem(item.id, { is_available: !item.is_available });
    onRefresh();
  };

  const handleDelete = async (id: number) => {
    await posApi.deleteMenuItem(id);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-6 gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <input
          type="text"
          required
          placeholder="Dish Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="md:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          type="text"
          required
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          type="number"
          required
          min={0}
          placeholder="Price (₹)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <select
          value={isVeg ? 'veg' : 'nonveg'}
          onChange={(e) => setIsVeg(e.target.value === 'veg')}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="veg">Veg</option>
          <option value="nonveg">Non-Veg</option>
        </select>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" /> Add Dish
        </button>
        <input
          type="text"
          placeholder="Short description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="md:col-span-6 rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3.5">Dish</th>
              <th className="px-5 py-3.5">Category</th>
              <th className="px-5 py-3.5">Type</th>
              <th className="px-5 py-3.5 text-right">Price</th>
              <th className="px-5 py-3.5 text-center">Availability</th>
              <th className="px-5 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {menu.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-3.5">
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                </td>
                <td className="px-5 py-3.5 text-slate-600">{item.category}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      item.is_veg ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {item.is_veg ? 'Veg' : 'Non-Veg'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right font-semibold">{formatINR(item.price)}</td>
                <td className="px-5 py-3.5 text-center">
                  <button
                    onClick={() => toggleAvailability(item)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      item.is_available
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {item.is_available ? 'In Stock' : 'Out of Stock'}
                  </button>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    title="Delete item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
