import { describe, expect, it } from 'vitest';
import { formatCNY } from '../src/lib/money';

describe('formatCNY', () => {
  it('亿元', () => {
    expect(formatCNY(1.25e9)).toBe('12.5亿元');
    expect(formatCNY(3e9)).toBe('30亿元');
  });
  it('万元', () => {
    expect(formatCNY(4.5e7)).toBe('4500万元');
    expect(formatCNY(12_300)).toBe('1.2万元');
  });
  it('元', () => {
    expect(formatCNY(0)).toBe('0元');
    expect(formatCNY(800)).toBe('800元');
  });
});
