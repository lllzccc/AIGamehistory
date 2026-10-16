import { describe, expect, it } from 'vitest';
import { getYearBuckets, filterBucket } from '../src/lib/data';
import { searchRiver } from '../src/lib/riverSearch';
import { makeDataset } from './fixtures';

describe('chronicle keyword search', () => {
  it('matches product aliases, ignoring case, whitespace and full-width letters', () => {
    const ds = makeDataset();
    ds.products[0].aliases = ['First Game'];
    const out = searchRiver(getYearBuckets(ds, 2026).reverse(), ' ＦＩＲＳＴ game ');
    expect(out.flatMap(b => b.launches).map(p => p.id)).toEqual(['a-first']);
    expect(out.map(b => b.year)).toEqual([2015]);
  });
  it('finds company aliases and products it develops or publishes across years', () => {
    const ds = makeDataset();
    ds.companies[0].aliases = ['阿尔法'];
    const out = searchRiver(getYearBuckets(ds, 2026).reverse(), '阿尔法');
    expect(out.flatMap(b => b.founded).map(c => c.id)).toEqual(['alpha']);
    expect(out.flatMap(b => b.launches).map(p => p.id)).toEqual(['b-first', 'a-second', 'a-first']);
    expect(out.flatMap(b => b.events).map(e => e.id)).toContain('alpha-a-round');
    expect(out.every((b, i) => !i || b.year < out[i - 1].year)).toBe(true);
  });
  it('respects category filters and returns an empty state for no matches', () => {
    const buckets = getYearBuckets(makeDataset(), 2026);
    const out = searchRiver(buckets.map(b => filterBucket(b, 'dressup')), 'Alpha');
    expect(out.flatMap(b => b.launches).map(p => p.id)).toEqual(['a-first']);
    expect(searchRiver(buckets, '不存在的关键词')).toEqual([]);
    expect(searchRiver(buckets, '  ')).toBe(buckets);
  });
});
