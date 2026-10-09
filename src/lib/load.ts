import { getCollection } from 'astro:content';
import { checkIntegrity, listFreePublishers } from './data';
import type { Dataset } from './types';

export async function loadDataset(): Promise<Dataset> {
  const [companies, products, people, events, market] = await Promise.all([
    getCollection('companies'),
    getCollection('products'),
    getCollection('people'),
    getCollection('events'),
    getCollection('market'),
  ]);

  const ds: Dataset = {
    companies: companies.map((e) => ({ id: e.id, ...e.data })),
    products: products.map((e) => ({ id: e.id, ...e.data })),
    people: people.map((e) => ({ id: e.id, ...e.data })),
    events: events.map((e) => ({ id: e.id, ...e.data })),
    market: market.map((e) => ({ id: e.id, ...e.data })),
  };

  const errors = checkIntegrity(ds);
  if (errors.length > 0) {
    throw new Error(`数据引用错误：\n${errors.join('\n')}`);
  }

  const freePublishers = listFreePublishers(ds);
  if (freePublishers.length > 0) {
    console.info(`自由文本发行方（请沿用已有写法）：${freePublishers.join('、')}`);
  }
  return ds;
}
