export function parseAmountExpr(expr: string): number {
  const clean = expr.replace(/\s+/g, '').replace(/−/g, '-');
  if (!clean) return 0;
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[+-](?:\d+(?:\.\d*)?|\.\d+))*[+-]?$/.test(clean)) {
    return 0;
  }

  const tokens = clean.match(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)/g);
  if (!tokens) return 0;

  let totalCents = 0;
  for (const token of tokens) {
    const sign = token.startsWith('-') ? -1 : 1;
    const rawNum = token.replace(/^[+-]/, '');
    if (!rawNum || rawNum === '.') continue;
    const value = Number.parseFloat(rawNum);
    if (!Number.isFinite(value)) return 0;
    totalCents += sign * Math.round(value * 100);
  }

  return totalCents > 0 ? totalCents : 0;
}

export function formatCents(cents: number, decimals = 2): string {
  const safe = Math.abs(cents) < 0.5 ? 0 : cents;
  return (safe / 100).toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatYuan(cents: number, decimals = 2): string {
  if (cents < 0) {
    return `-¥${formatCents(Math.abs(cents), decimals)}`;
  }
  return `¥${formatCents(cents, decimals)}`;
}

export function centsToInputStr(cents: number): string {
  if (cents <= 0) return '';
  const yuan = cents / 100;
  if (Number.isInteger(yuan)) return String(yuan);
  return yuan.toFixed(2).replace(/0$/, '');
}
