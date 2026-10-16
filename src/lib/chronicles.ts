import type { Dataset } from './types';

export const chronicles = [
  { id: 'female', title: '女性向游戏编年史', shortTitle: '女性向', edition: '卷一', subtitle: '关于心动、想象与另一种人生', description: '从换装、乙女到宫廷恋爱，追踪公司、产品与创作它们的人。', color: '#703d4d', accent: '#e5cfa7' },
  { id: 'casual', title: '休闲游戏编年史', shortTitle: '休闲', edition: '卷二', subtitle: '小小的玩法，长长的故事', description: '从消除、合成到模拟经营，记录那些进入日常生活的游戏与公司。', color: '#365e60', accent: '#d8dcb3' },
  { id: 'slg', title: 'SLG游戏编年史', shortTitle: 'SLG', edition: '卷三', subtitle: '关于疆域、联盟与长久的博弈', description: '从城建经营到联盟战争，记录策略游戏公司的产品、团队与全球征程。', color: '#514b35', accent: '#e1c99c' },
] as const;
export type ChronicleId = typeof chronicles[number]['id'];

export const chronicleArtwork: Record<ChronicleId, string> = {
  female: '/images/home-ensemble-v2.png',
  casual: '/images/casual-ensemble-v2.png',
  slg: '/images/slg-ensemble-v2.png',
};

export function selectChronicle(ds: Dataset, id: ChronicleId): Dataset {
  const products = ds.products.filter(p => (p.chronicles ?? ['female']).includes(id));
  const productIds = new Set(products.map(p => p.id));
  const companyIds = new Set(products.flatMap(p => [p.developer, p.publisher]));
  const companies = ds.companies.filter(c => companyIds.has(c.id));
  const people = ds.people.map(p => ({
    ...p,
    roles: p.roles.filter(r => companyIds.has(r.company) && ((r.scope === 'company' && (!r.specialties?.length || products.some(p => (p.developer === r.company || p.publisher === r.company) && r.specialties!.includes(p.genre)))) || (r.scope === 'product' && r.products.some(id => productIds.has(id)))))
      .map(r => ({ ...r, products: r.products.filter(id => productIds.has(id)) })),
  })).filter(p => p.roles.length > 0);
  const events = ds.events.filter(e => e.companies.some(id => companyIds.has(id)) && (!e.products.length || e.products.some(id => productIds.has(id))))
    .map(e => ({ ...e, companies: e.companies.filter(id => companyIds.has(id)), products: e.products.filter(id => productIds.has(id)) }));
  return { companies, products, people, events, market: id === 'female' ? ds.market : [] };
}
