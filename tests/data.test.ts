import { describe, expect, it } from 'vitest';
import {
  COMPARE_THICKNESS_MAX,
  COMPARE_THICKNESS_MIN,
  bucketSize,
  checkIntegrity,
  compareThickness,
  displayCompanyName,
  filterBucket,
  getCompanyView,
  getCompareLanes,
  getYearBuckets,
  listFreePublishers,
  marketSeries,
  representativeRevenue,
  revenueSeries,
  toProductCards,
} from '../src/lib/data';
import { makeDataset } from './fixtures';

describe('checkIntegrity', () => {
  it('引用完整时无错误', () => {
    expect(checkIntegrity(makeDataset())).toEqual([]);
  });

  it('发现不存在的研发方、任职公司和事件引用', () => {
    const ds = makeDataset();
    ds.products[0].developer = 'ghost-dev';
    ds.people[1].roles[0].company = 'ghost-co';
    ds.events[0].products = ['ghost-product'];
    const errors = checkIntegrity(ds).join('\n');
    expect(errors).toContain('ghost-dev');
    expect(errors).toContain('ghost-co');
    expect(errors).toContain('ghost-product');
  });

  it('发行方允许填未收录的名称', () => {
    const ds = makeDataset();
    ds.products[0].publisher = '腾讯';
    expect(checkIntegrity(ds)).toEqual([]);
  });

  it('发现年度与季度混用的流水', () => {
    const ds = makeDataset();
    ds.products[0].revenue.push({ period: '2017-Q1', amountCNY: 1, kind: 'estimate', source: ds.products[0].sources[0], partial: false, lowerBound: false });
    expect(checkIntegrity(ds).join('\n')).toContain('a-first');
  });

  it('发现同一期间重复的流水', () => {
    const ds = makeDataset();
    ds.products[0].revenue.push({ period: '2015', amountCNY: 2e8, kind: 'estimate', source: ds.products[0].sources[0], partial: false, lowerBound: false });
    const errors = checkIntegrity(ds).join('\n');
    expect(errors).toContain('a-first');
    expect(errors).toContain('2015');
  });

  it('已停服的产品必须有停服日期', () => {
    const ds = makeDataset();
    delete ds.products[1].shutdown;
    expect(checkIntegrity(ds).join('\n')).toContain('a-second');
  });

  it('有停服日期的产品状态必须是已停服', () => {
    const ds = makeDataset();
    ds.products[0].shutdown = '2020-01';
    expect(checkIntegrity(ds).join('\n')).toContain('a-first');
  });

  it('停服日期不能早于上线日期', () => {
    const ds = makeDataset();
    ds.products[1].shutdown = '2016-01';
    expect(checkIntegrity(ds).join('\n')).toContain('a-second');
  });

  it('任职结束时间不能早于开始时间', () => {
    const ds = makeDataset();
    ds.people[0].roles[0].to = '2018';
    expect(checkIntegrity(ds).join('\n')).toContain('founder');
  });

  it('发现重复年份的市场数据', () => {
    const ds = makeDataset();
    ds.market.push({ ...ds.market[0], id: '2016-b' });
    expect(checkIntegrity(ds).join('\n')).toContain('2016');
  });

  it('发现口径不一致的市场数据', () => {
    const ds = makeDataset();
    ds.market[1].scope = '另一种口径';
    expect(checkIntegrity(ds).join('\n')).toContain('口径');
  });
});

describe('listFreePublishers', () => {
  it('列出不是已收录公司 id 的发行方，去重排序', () => {
    const ds = makeDataset();
    expect(listFreePublishers(ds)).toEqual(['某发行商']);
    ds.products[1].publisher = '腾讯游戏';
    ds.products.push({ ...ds.products[1], id: 'a-third', publisher: '腾讯' });
    expect(listFreePublishers(ds)).toEqual(['腾讯', '腾讯游戏']);
  });
});

describe('displayCompanyName', () => {
  it('id 转成公司名，未收录的名称原样返回', () => {
    const ds = makeDataset();
    expect(displayCompanyName(ds, 'alpha')).toBe('Alpha 游戏');
    expect(displayCompanyName(ds, '某发行商')).toBe('某发行商');
  });
});

describe('revenueSeries', () => {
  it('按期间排序并展开来源', () => {
    const series = revenueSeries(makeDataset().products[0]);
    expect(series.map((p) => p.period)).toEqual(['2015', '2016']);
    expect(series[0]).toMatchObject({
      x: 2015,
      amountCNY: 1e8,
      kind: 'official',
      partial: false,
      lowerBound: false,
      sourceTitle: '测试来源',
    });
  });
});

describe('toProductCards', () => {
  it('补充研发、发行名称和流水序列', () => {
    const ds = makeDataset();
    const [card] = toProductCards(ds, [ds.products[2]]);
    expect(card.developerName).toBe('Beta 工作室');
    expect(card.publisherName).toBe('Alpha 游戏');
    expect(card.series).toEqual([]);
  });

  it('发行方是已收录公司时给出 publisherId，否则为空', () => {
    const ds = makeDataset();
    const [second, third] = toProductCards(ds, [ds.products[1], ds.products[2]]);
    expect(second.publisherId).toBeUndefined();
    expect(third.publisherId).toBe('alpha');
  });

  it('关键节点包含上线、停服和关联事件，按日期排序', () => {
    const ds = makeDataset();
    const [first, second, third] = toProductCards(ds, ds.products);
    expect(first.milestones.map((m) => m.id)).toEqual(['launch-a-first']);
    expect(second.milestones.map((m) => m.id)).toEqual(['launch-a-second', 'shutdown-a-second']);
    expect(third.milestones.map((m) => m.id)).toEqual(['joint', 'launch-b-first']);
    expect(third.milestones[0].sources).toHaveLength(1);
  });
});

describe('getCompanyView', () => {
  it('包含研发或发行的作品，按首发时间排序', () => {
    const view = getCompanyView(makeDataset(), 'alpha');
    expect(view.products.map((p) => p.id)).toEqual(['a-first', 'a-second', 'b-first']);
  });

  it('人物只保留在本公司任职的人，并区分本公司与其他公司的任职', () => {
    const view = getCompanyView(makeDataset(), 'alpha');
    expect(view.people.map((p) => p.person.id)).toEqual(['founder']);
    expect(view.people[0].roles.map((r) => r.title)).toEqual(['创始人']);
    expect(view.people[0].elsewhere.map((r) => r.company)).toEqual(['beta']);
  });

  it('事件按日期排序', () => {
    const view = getCompanyView(makeDataset(), 'alpha');
    expect(view.events.map((e) => e.id)).toEqual(['alpha-a-round', 'joint']);
  });

  it('时间轴合并成立、上线、停服与事件，并按日期排序', () => {
    const view = getCompanyView(makeDataset(), 'alpha');
    expect(view.timeline.map((t) => [t.date, t.kind])).toEqual([
      ['2013-05', 'founded'],
      ['2015-06-01', 'launch'],
      ['2016-03', 'funding'],
      ['2017-12', 'launch'],
      ['2019', 'milestone'],
      ['2021-06-24', 'launch'],
      ['2023-03', 'shutdown'],
    ]);
    expect(view.timeline[1].label).toBe('《初作》上线');
    expect(view.timeline[4].verified).toBe(false);
    expect(view.timeline[0]).toMatchObject({ id: 'founded-alpha', productIds: [] });
    expect(view.timeline[1]).toMatchObject({ id: 'launch-a-first', productIds: ['a-first'] });
    expect(view.timeline[4]).toMatchObject({ id: 'joint', productIds: ['b-first'] });
    expect(view.timeline.every((t) => t.sources.length > 0)).toBe(true);
  });

  it('未收录的公司抛出错误', () => {
    expect(() => getCompanyView(makeDataset(), 'nope')).toThrow('nope');
  });
});

describe('getYearBuckets', () => {
  const buckets = getYearBuckets(makeDataset(), 2024);
  const at = (year: number) => buckets.find((b) => b.year === year)!;

  it('覆盖从最早年份到 endYear 的每一年，包含空年份', () => {
    expect(buckets.map((b) => b.year)).toEqual([
      2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024,
    ]);
    expect(bucketSize(at(2014))).toBe(0);
  });

  it('成立的公司带上其作品品类', () => {
    expect(at(2013).founded.map((c) => [c.id, c.genres])).toEqual([['alpha', ['otome', 'dressup']]]);
    expect(at(2018).founded.map((c) => [c.id, c.genres])).toEqual([['beta', ['otome']]]);
  });

  it('上线作品是完整的 ProductCard', () => {
    expect(at(2015).launches.map((p) => p.id)).toEqual(['a-first']);
    expect(at(2015).launches[0].developerName).toBe('Alpha 游戏');
  });

  it('事件包含停服，并带公司名和品类', () => {
    expect(at(2023).events.map((e) => [e.id, e.kind])).toEqual([['shutdown-a-second', 'shutdown']]);
    const joint = at(2019).events[0];
    expect(joint.companies.map((c) => c.name)).toEqual(['Alpha 游戏', 'Beta 工作室']);
    expect(joint.genres).toEqual(['otome']);
    expect(at(2016).events[0].genres).toEqual(['otome', 'dressup']);
  });

  it('bucketSize 统计三类条目总数', () => {
    expect(bucketSize(at(2013))).toBe(1);
    expect(bucketSize(at(2021))).toBe(1);
  });
});

describe('filterBucket', () => {
  const buckets = getYearBuckets(makeDataset(), 2024);
  const at = (year: number) => buckets.find((b) => b.year === year)!;

  it('all 原样返回', () => {
    expect(filterBucket(at(2019), 'all')).toBe(at(2019));
  });

  it('按品类过滤公司、作品和事件', () => {
    expect(filterBucket(at(2013), 'dressup').founded.map((c) => c.id)).toEqual(['alpha']);
    expect(filterBucket(at(2015), 'otome').launches).toEqual([]);
    expect(filterBucket(at(2016), 'dressup').events).toHaveLength(1);
    expect(filterBucket(at(2019), 'dressup').events).toEqual([]);
  });
});

describe('marketSeries', () => {
  it('按年份升序并展开来源', () => {
    const series = marketSeries(makeDataset());
    expect(series.map((p) => p.year)).toEqual([2015, 2016]);
    expect(series[0]).toMatchObject({ amountCNY: 1e9, kind: 'estimate', scope: '测试口径', sourceTitle: '测试来源' });
  });
});

describe('getCompareLanes', () => {
  const ds = makeDataset();

  it('ids 为空时返回全部公司，按成立时间排序', () => {
    expect(getCompareLanes(ds, []).map((l) => l.company.id)).toEqual(['alpha', 'beta']);
  });

  it('忽略未知 id，只返回仍存在的公司', () => {
    expect(getCompareLanes(ds, ['beta', 'ghost']).map((l) => l.company.id)).toEqual(['beta']);
  });

  it('产品只收本公司自研，按上线排序；事件只含本公司', () => {
    const [alpha] = getCompareLanes(ds, ['alpha']);
    expect(alpha.products.map((p) => p.id)).toEqual(['a-first', 'a-second']);
    expect(alpha.products[0].developerName).toBe('Alpha 游戏');
    expect(alpha.events.map((e) => e.id)).toEqual(['alpha-a-round', 'joint']);
  });

  it('全部 id 都不存在时返回空数组', () => {
    expect(getCompareLanes(ds, ['ghost'])).toEqual([]);
  });
});

describe('representativeRevenue', () => {
  it('取期间最晚的一条；没有流水则 undefined', () => {
    const ds = makeDataset();
    expect(representativeRevenue(ds.products[0])?.period).toBe('2016');
    expect(representativeRevenue(ds.products[1])).toBeUndefined();
  });
});

describe('compareThickness', () => {
  const source = { title: 's', url: 'https://example.com' };
  const entry = (amountCNY: number, basis: 'store' | 'all-platform' = 'store') => ({
    period: '2024',
    amountCNY,
    kind: 'estimate' as const,
    basis,
    partial: false,
    lowerBound: false,
    source,
  });
  const product = (id: string, revenue: ReturnType<typeof entry>[]) =>
    ({
      id,
      name: id,
      aliases: [],
      genre: 'otome' as const,
      developer: 'alpha',
      publisher: 'alpha',
      released: '2020',
      platforms: ['iOS'],
      status: 'live' as const,
      significance: 'x',
      revenue,
      sources: [source],
      verified: true,
    });

  it('没有口径时用最细条', () => {
    expect(compareThickness(product('a', []), [product('b', [entry(1e9)])])).toBe(COMPARE_THICKNESS_MIN);
  });

  it('只在同一 basis 内比较粗细', () => {
    const storeSmall = product('a', [entry(1e8, 'store')]);
    const storeLarge = product('b', [entry(9e8, 'store')]);
    const allPlat = product('c', [entry(9e9, 'all-platform')]);
    expect(compareThickness(storeSmall, [storeSmall, storeLarge, allPlat])).toBe(COMPARE_THICKNESS_MIN);
    expect(compareThickness(storeLarge, [storeSmall, storeLarge, allPlat])).toBe(COMPARE_THICKNESS_MAX);
    expect(compareThickness(allPlat, [storeSmall, storeLarge, allPlat])).toBe(
      (COMPARE_THICKNESS_MIN + COMPARE_THICKNESS_MAX) / 2,
    );
  });
});
