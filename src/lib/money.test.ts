import { describe, expect, it } from 'vitest';
import { centsToInputStr, formatCents, formatYuan, parseAmountExpr } from './money';

describe('money', () => {
  it('parses integers, decimals, and arithmetic expressions into cents', () => {
    expect(parseAmountExpr('35')).toBe(3500);
    expect(parseAmountExpr('12.5')).toBe(1250);
    expect(parseAmountExpr('35+12')).toBe(4700);
    expect(parseAmountExpr('12+8.5')).toBe(2050);
    expect(parseAmountExpr('12+8.5-0.5')).toBe(2000);
    expect(parseAmountExpr('0.1+0.2')).toBe(30);
    expect(parseAmountExpr('.5')).toBe(50);
    expect(parseAmountExpr('12+')).toBe(1200);
    expect(parseAmountExpr('20−5.5')).toBe(1450);
  });

  it('returns 0 for empty, non-positive, or invalid expressions', () => {
    expect(parseAmountExpr('')).toBe(0);
    expect(parseAmountExpr('0')).toBe(0);
    expect(parseAmountExpr('-5')).toBe(0);
    expect(parseAmountExpr('5-10')).toBe(0);
    expect(parseAmountExpr('12*2')).toBe(0);
    expect(parseAmountExpr('abc')).toBe(0);
  });

  it('formats cents and yuan cleanly', () => {
    expect(formatCents(2050)).toBe('20.50');
    expect(formatCents(328650)).toBe('3,286.50');
    expect(formatCents(10000, 0)).toBe('100');
    expect(formatYuan(2050)).toBe('¥20.50');
    expect(formatYuan(-500)).toBe('-¥5.00');
    expect(centsToInputStr(1250)).toBe('12.5');
    expect(centsToInputStr(1200)).toBe('12');
    expect(centsToInputStr(1205)).toBe('12.05');
  });
});
