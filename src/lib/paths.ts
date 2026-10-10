export function withBase(path: string, base = import.meta.env.BASE_URL ?? '/'): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const prefix = base === '/' ? '' : '/' + base.replace(/^\/+|\/+$/g, '');
  return prefix + path;
}
