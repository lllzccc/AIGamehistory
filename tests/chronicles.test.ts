import { describe, expect, it } from 'vitest';
import { selectChronicle } from '../src/lib/chronicles';
import { makeDataset } from './fixtures';
describe('编年史分卷', () => {
 it('旧内容默认保留女性向归属', () => {
  const ds = makeDataset();
  expect(selectChronicle(ds, 'female').products).toHaveLength(3);
  expect(selectChronicle(ds, 'casual').products).toHaveLength(0);
 });
 it('同一公司跨卷出现，但作品、项目人才与市场数据不会串卷', () => {
  const ds = makeDataset();
  ds.products[0].chronicles = ['casual'];
  const casual = selectChronicle(ds, 'casual');
  expect(casual.companies.map(c => c.id)).toEqual(['alpha']);
  expect(casual.products.map(p => p.id)).toEqual(['a-first']);
  expect(casual.people.map(p => p.id)).toEqual(['founder']);
  expect(casual.people[0].roles).toHaveLength(1);
  expect(casual.events.map(e => e.id)).toEqual(['alpha-a-round']);
  expect(casual.market).toEqual([]);
  expect(selectChronicle(ds, 'female').products.map(p => p.id)).toEqual(['a-second', 'b-first']);
  expect(ds.people[0].roles).toHaveLength(2);
 });
 it('同一产品可跨卷，项目履历只保留本卷引用', () => {
  const ds = makeDataset();
  ds.products[0].chronicles = ['female', 'casual'];
  ds.people[1].roles[0] = { ...ds.people[1].roles[0], company: 'alpha', products: ['a-first', 'b-first'] };
  const casual = selectChronicle(ds, 'casual');
  expect(casual.people.find(p => p.id === 'producer')!.roles[0].products).toEqual(['a-first']);
  expect(selectChronicle(ds, 'female').products).toHaveLength(3);
 });
});
