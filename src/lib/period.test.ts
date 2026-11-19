import { describe, expect, it } from 'vitest';
import {
  formatDateHeader,
  formatMonthLabel,
  getMonthRange,
  getPreviousPeriodRange,
  getYearRange,
  shiftMonth,
} from './period';

describe('period', () => {
  it('computes natural month start and end including leap Feb', () => {
    expect(getMonthRange('2026-11')).toEqual({ start: '2026-11-01', end: '2026-11-30' });
    expect(getMonthRange('2024-02')).toEqual({ start: '2024-02-01', end: '2024-02-29' });
    expect(getMonthRange('2026-02')).toEqual({ start: '2026-02-01', end: '2026-02-28' });
    expect(getYearRange(2026)).toEqual({ start: '2026-01-01', end: '2026-12-31' });
  });

  it('shifts months across year boundaries', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });

  it('computes previous period range for month, year, and custom spans', () => {
    expect(getPreviousPeriodRange('month', { start: '2026-03-01', end: '2026-03-31' })).toEqual({
      start: '2026-02-01',
      end: '2026-02-28',
    });
    expect(getPreviousPeriodRange('year', { start: '2026-01-01', end: '2026-12-31' })).toEqual({
      start: '2025-01-01',
      end: '2025-12-31',
    });
    expect(getPreviousPeriodRange('custom', { start: '2026-11-10', end: '2026-11-12' })).toEqual({
      start: '2026-11-07',
      end: '2026-11-09',
    });
    expect(
      getPreviousPeriodRange('month', { start: '2026-11-01', end: '2026-11-30' }, '2026-11-18'),
    ).toEqual({
      start: '2026-10-01',
      end: '2026-10-18',
    });
  });

  it('formats date headers and month labels', () => {
    expect(formatMonthLabel('2026-11')).toBe('2026年11月');
    expect(formatDateHeader('2026-11-18', '2026-11-18')).toBe('今天');
    expect(formatDateHeader('2026-11-17', '2026-11-18')).toBe('昨天');
    expect(formatDateHeader('2026-11-16', '2026-11-18')).toBe('11月16日 周一');
    expect(formatDateHeader('2025-12-31', '2026-11-18')).toBe('2025年12月31日 周三');
  });
});
