export function parseCompareIds(query: string, knownIds: string[]): string[] {
  const params = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query);
  if (!params.has('c')) return [...knownIds];
  return [...new Set((params.get('c') ?? '').split(',').map((id) => id.trim()).filter((id) => knownIds.includes(id)))];
}

export function serializeCompareIds(ids: string[]): string {
  return [...new Set(ids)].sort().join(',');
}
