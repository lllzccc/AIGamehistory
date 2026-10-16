import { bucketSize } from './data';
import type { YearBucket } from './types';

const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, '');

/** Search names and aliases; company matches also include its developed/published products. */
export function searchRiver(buckets: YearBucket[], query: string): YearBucket[] {
  const keyword = normalize(query);
  if (!keyword) return buckets;
  const matches = (values: string[]) => values.some(value => normalize(value).includes(keyword));
  const companyIds = new Set(buckets.flatMap(b => b.founded)
    .filter(c => matches([c.name, ...(c.aliases ?? [])])).map(c => c.id));
  const productIds = new Set(buckets.flatMap(b => b.launches)
    .filter(p => matches([p.name, ...p.aliases, p.developerName, p.publisherName]) ||
      companyIds.has(p.developer) || companyIds.has(p.publisher))
    .map(p => p.id));
  return buckets.map(b => ({
    ...b,
    founded: b.founded.filter(c => companyIds.has(c.id)),
    launches: b.launches.filter(p => productIds.has(p.id)),
    events: b.events.filter(e => e.productIds.some(id => productIds.has(id)) ||
      e.companies.some(c => companyIds.has(c.id) || matches([c.name])) || matches([e.label])),
  })).filter(b => bucketSize(b) > 0);
}
