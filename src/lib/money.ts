function trim(value: number): string {
  return String(Number(value.toFixed(1)));
}

export function formatCNY(amount: number): string {
  if (amount >= 1e8) return `${trim(amount / 1e8)}亿元`;
  if (amount >= 1e4) return `${trim(amount / 1e4)}万元`;
  return `${amount}元`;
}
