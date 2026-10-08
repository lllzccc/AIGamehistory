export function yearOf(date: string): number {
  return Number(date.slice(0, 4));
}

export function compareDates(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function formatDate(date: string): string {
  const [year, month, day] = date.split('-');
  if (day) return `${year}年${Number(month)}月${Number(day)}日`;
  if (month) return `${year}年${Number(month)}月`;
  return `${year}年`;
}

export function dateToNumber(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  return year + (month ? (month - 1) / 12 : 0) + (day ? (day - 1) / 365 : 0);
}

export function periodToNumber(period: string): number {
  const [year, quarter] = period.split('-Q');
  return Number(year) + (quarter ? (Number(quarter) - 1) / 4 : 0);
}
