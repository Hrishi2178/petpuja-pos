import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { posApi } from '../api';
import type { DiningTable, MenuItem, Order } from '../types';
import { POSView } from './POSView';

const mockMenu: MenuItem[] = [
  {
    id: 1,
    name: 'Paneer Tikka',
    category: 'Starters',
    price: 200,
    is_veg: true,
    is_available: true,
    description: 'Char-grilled cottage cheese',
  },
  {
    id: 2,
    name: 'Butter Naan',
    category: 'Breads',
    price: 50,
    is_veg: true,
    is_available: true,
    description: 'Soft tandoor flatbread',
  },
];

const mockTables: DiningTable[] = [
  {
    id: 10,
    table_number: 'T1',
    section: 'Main Hall',
    capacity: 4,
    status: 'available',
    active_order_id: null,
  },
];

describe('POSView', () => {
  it('adds items to cart, calculates 5% GST, and validates Dine-In table selection', async () => {
    const user = userEvent.setup();
    render(
      <POSView
        menu={mockMenu}
        tables={mockTables}
        preselectedTableId={null}
        onClearPreselectedTable={vi.fn()}
        onOrderCreated={vi.fn()}
      />
    );

    // Click Paneer Tikka (₹200) -> 5% GST = ₹10 -> Total = ₹210
    await user.click(screen.getByText('Paneer Tikka'));
    expect(screen.getByText('1 in cart')).toBeInTheDocument();
    expect(screen.getByText('₹10.00')).toBeInTheDocument();
    expect(screen.getByText('₹210.00')).toBeInTheDocument();

    // Clicking Send KOT without picking a table should show validation error
    await user.click(screen.getByRole('button', { name: /send kot only/i }));
    expect(
      screen.getByText('Please select a table for Dine-In orders.')
    ).toBeInTheDocument();
  });

  it('submits a Dine-In KOT order when a table is selected', async () => {
    const user = userEvent.setup();
    const onOrderCreated = vi.fn();

    const fakeOrder: Order = {
      id: 99,
      order_number: 'PP-1099',
      order_type: 'dine_in',
      table_id: 10,
      table_number: 'T1',
      customer_name: 'Walk-in Customer',
      customer_phone: '',
      subtotal: 200,
      discount_percent: 0,
      discount_amount: 0,
      tax_rate: 5,
      tax_amount: 10,
      total_amount: 210,
      payment_method: 'pending',
      payment_status: 'unpaid',
      kot_status: 'pending',
      notes: '',
      created_at: new Date().toISOString(),
      items: [],
    };

    const createSpy = vi
      .spyOn(posApi, 'createOrder')
      .mockResolvedValueOnce(fakeOrder);

    render(
      <POSView
        menu={mockMenu}
        tables={mockTables}
        preselectedTableId={null}
        onClearPreselectedTable={vi.fn()}
        onOrderCreated={onOrderCreated}
      />
    );

    await user.click(screen.getByText('Paneer Tikka'));
    await user.selectOptions(screen.getByRole('combobox'), '10');
    await user.click(screen.getByRole('button', { name: /send kot only/i }));

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(onOrderCreated).toHaveBeenCalledWith(fakeOrder);
    createSpy.mockRestore();
  });
});