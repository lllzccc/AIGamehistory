import { describe, expect, it } from 'vitest';
import { checkIntegrity, displayCompanyName, getCompanyView, revenueSeries, toProductCards } from '../src/lib/data';
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
    ds.products[0].revenue.push({ period: '2017-Q1', amountCNY: 1, kind: 'estimate', source: ds.products[0].sources[0] });
    expect(checkIntegrity(ds).join('\n')).toContain('a-first');
  });

  it('发现同一期间重复的流水', () => {
    const ds = makeDataset();
    ds.products[0].revenue.push({ period: '2015', amountCNY: 2e8, kind: 'estimate', source: ds.products[0].sources[0] });
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
    expect(series[0]).toMatchObject({ x: 2015, amountCNY: 1e8, kind: 'official', sourceTitle: '测试来源' });
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
  });

  it('未收录的公司抛出错误', () => {
    expect(() => getCompanyView(makeDataset(), 'nope')).toThrow('nope');
  });
});
