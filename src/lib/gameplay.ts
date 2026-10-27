import type { Product, YearBucket } from './types';

export const coreGameplayLabels = {
  'cok-like': 'COK-like · 城建行军',
  'rok-like': 'ROK-like · 自由行军',
  seasonal: '赛季地块 · 领土争夺',
  other: '其他策略体系',
} as const;
export const fusionGameplayLabels = {
  merge: '合成（未细分）', 'merge-2': '二合 · Merge-2', 'merge-3': '三合 · Merge-3', 'match-3': '三消', 'tower-defense': '塔防',
  shooting: '射击／弹道', simulation: '模拟经营', card: '卡牌',
} as const;
export type CoreFilter = keyof typeof coreGameplayLabels | 'all' | 'unclassified';
export type FusionFilter = keyof typeof fusionGameplayLabels | 'all';

export function matchesGameplay(product: Product, core: CoreFilter, fusion: FusionFilter): boolean {
  const style = product.gameplay;
  return (core === 'all' || (core === 'unclassified' ? !style?.core : style?.core === core)) &&
    (fusion === 'all' || !!style?.fusion.includes(fusion));
}

/** Keep company births and events related to matching products, even in a different year. */
export function filterGameplayBuckets(buckets: YearBucket[], core: CoreFilter, fusion: FusionFilter): YearBucket[] {
  if (core === 'all' && fusion === 'all') return buckets;
  const products = buckets.flatMap(b => b.launches).filter(p => matchesGameplay(p, core, fusion));
  const ids = new Set(products.map(p => p.id));
  const companies = new Set(products.flatMap(p => [p.developer, p.publisherId].filter((id): id is string => !!id)));
  return buckets.map(b => ({
    ...b,
    launches: b.launches.filter(p => ids.has(p.id)),
    founded: b.founded.filter(c => companies.has(c.id)),
    events: b.events.filter(e => e.productIds.length ? e.productIds.some(id => ids.has(id)) : e.companies.some(c => companies.has(c.id))),
  })).filter(b => b.launches.length + b.founded.length + b.events.length > 0);
}
