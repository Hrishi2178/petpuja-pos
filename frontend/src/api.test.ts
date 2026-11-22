import { describe, expect, it } from 'vitest';
import { formatINR } from './api';

describe('formatINR', () => {
  it('formats Indian currency with commas and two decimal places', () => {
    expect(formatINR(1250)).toBe('₹1,250.00');
    expect(formatINR(99.5)).toBe('₹99.50');
    expect(formatINR(0)).toBe('₹0.00');
  });
});