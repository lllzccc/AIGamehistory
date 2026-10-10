import type { Dataset } from '../src/lib/types';

const sources = [{ title: '测试来源', url: 'https://example.com' }];

export function makeDataset(): Dataset {
  return {
    companies: [
      { id: 'alpha', name: 'Alpha 游戏', aliases: [], founded: '2013-05', headquarters: '苏州', kind: 'independent', status: 'active', tagline: '测试公司', sources, verified: true },
      { id: 'beta', name: 'Beta 工作室', aliases: [], founded: '2018', headquarters: '深圳', kind: 'studio', parent: '某大厂', status: 'active', tagline: '测试工作室', sources, verified: false },
    ],
    products: [
      {
        id: 'a-first', name: '初作', aliases: [], genre: 'dressup', developer: 'alpha', publisher: 'alpha',
        released: '2015-06-01', platforms: ['iOS', 'Android'], status: 'live', significance: '第一款作品',
        revenue: [
          { period: '2016', amountCNY: 5e8, kind: 'estimate', source: sources[0], partial: false, lowerBound: false },
          { period: '2015', amountCNY: 1e8, kind: 'official', source: sources[0], partial: false, lowerBound: false },
        ],
        sources, verified: true,
      },
      {
        id: 'a-second', name: '次作', aliases: [], genre: 'otome', developer: 'alpha', publisher: '某发行商',
        released: '2017-12', shutdown: '2023-03', platforms: ['iOS'], status: 'shutdown', significance: '第二款作品',
        revenue: [], sources, verified: true,
      },
      {
        id: 'b-first', name: '代理作', aliases: [], genre: 'otome', developer: 'beta', publisher: 'alpha',
        released: '2021-06-24', platforms: ['Android'], status: 'live', significance: '由 Alpha 发行',
        revenue: [], sources, verified: false,
      },
    ],
    people: [
      {
        id: 'founder', name: '张三', aliases: [], bio: '创始人', sources, verified: true,
        roles: [
          { company: 'beta', scope: 'company', products: [], title: 'other', titleNote: '顾问', from: '2019', to: '2020' },
          { company: 'alpha', scope: 'company', products: [], title: 'founder', from: '2013' },
        ],
      },
      {
        id: 'producer', name: '李四', aliases: ['阿四'], bio: '制作人', sources, verified: false,
        roles: [{ company: 'beta', scope: 'product', products: ['b-first'], title: 'producer', from: '2018' }],
      },
    ],
    events: [
      { id: 'joint', date: '2019', type: 'milestone', companies: ['alpha', 'beta'], products: ['b-first'], summary: '达成合作', sources, verified: false },
      { id: 'alpha-a-round', date: '2016-03', type: 'funding', companies: ['alpha'], products: [], summary: '完成 A 轮融资', sources, verified: true },
    ],
    market: [
      { id: '2016', year: 2016, amountCNY: 2e9, kind: 'estimate', scope: '测试口径', source: sources[0], verified: true },
      { id: '2015', year: 2015, amountCNY: 1e9, kind: 'estimate', scope: '测试口径', source: sources[0], verified: true },
    ],
  };
}
