import { describe, expect, it } from 'vitest';
import { companySchema, marketEntrySchema, partialDate, personSchema, productSchema, roleSchema } from '../src/lib/schema';

const source = { title: '官网', url: 'https://example.com' };

describe('partialDate', () => {
  it.each(['2013', '2013-05', '2013-05-07'])('接受 %s', (value) => {
    expect(partialDate.safeParse(value).success).toBe(true);
  });
  it.each(['13', '2013-5', '2013-13', '2013/05', '2013-05-32'])('拒绝 %s', (value) => {
    expect(partialDate.safeParse(value).success).toBe(false);
  });
});

describe('companySchema', () => {
  const valid = {
    name: '测试公司',
    founded: '2013',
    headquarters: '苏州',
    kind: 'independent',
    status: 'active',
    tagline: '一句话',
    sources: [source],
  };

  it('填充默认值', () => {
    const company = companySchema.parse(valid);
    expect(company.aliases).toEqual([]);
    expect(company.verified).toBe(false);
  });

  it('至少需要一个来源', () => {
    expect(companySchema.safeParse({ ...valid, sources: [] }).success).toBe(false);
  });
});

describe('productSchema', () => {
  const valid = {
    name: '测试作品',
    genre: 'otome',
    developer: 'alpha',
    publisher: '腾讯',
    released: '2017-12-20',
    platforms: ['iOS'],
    status: 'live',
    significance: '一句话',
    sources: [source],
  };
  const revenue = (period: string) => ({ period, amountCNY: 1e8, kind: 'estimate', source });

  it('接受年度与季度流水', () => {
    expect(productSchema.safeParse({ ...valid, revenue: [revenue('2024')] }).success).toBe(true);
    expect(productSchema.safeParse({ ...valid, revenue: [revenue('2024-Q3')] }).success).toBe(true);
  });

  it.each(['2024-Q5', '2024Q1', '24'])('拒绝流水期间 %s', (period) => {
    expect(productSchema.safeParse({ ...valid, revenue: [revenue(period)] }).success).toBe(false);
  });

  it('历史版本允许现状未知，并保存带来源的版本说明', () => {
    const p = productSchema.parse({ ...valid, status: 'unknown', versionLabel: '早期APP', lifecycleNotes: [{ note: '同名小游戏关系待查', sources: [source] }] });
    expect(p.status).toBe('unknown');
    expect(productSchema.safeParse({ ...valid, lifecycleNotes: [{ note: '未确认', sources: [] }] }).success).toBe(false);
  });

  it('流水默认为空数组', () => {
    expect(productSchema.parse(valid).revenue).toEqual([]);
  });

  it('流水缺省 basis，partial 与 lowerBound 为 false', () => {
    const parsed = productSchema.parse({ ...valid, revenue: [revenue('2024')] });
    expect(parsed.revenue[0].basis).toBeUndefined();
    expect(parsed.revenue[0].partial).toBe(false);
    expect(parsed.revenue[0].lowerBound).toBe(false);
  });

  it('接受三种口径', () => {
    for (const basis of ['store', 'all-platform', 'official-report'] as const) {
      const parsed = productSchema.parse({
        ...valid,
        revenue: [{ ...revenue('2024'), basis, partial: true, lowerBound: true }],
      });
      expect(parsed.revenue[0]).toMatchObject({ basis, partial: true, lowerBound: true });
    }
  });

  it('拒绝未知口径', () => {
    expect(
      productSchema.safeParse({
        ...valid,
        revenue: [{ ...revenue('2024'), basis: 'sensor-tower' }],
      }).success,
    ).toBe(false);
  });
});

describe('roleSchema / personSchema', () => {
  const companyRole = { company: 'alpha', scope: 'company', title: 'founder', from: '2013' };
  const productRole = { company: 'alpha', scope: 'product', products: ['a-first'], title: 'producer', from: '2018' };

  it('公司职务默认不挂产品，人物默认无花名', () => {
    const role = roleSchema.parse(companyRole);
    expect(role.products).toEqual([]);
    const person = personSchema.parse({ name: '张三', bio: '简介', roles: [companyRole], sources: [source] });
    expect(person.aliases).toEqual([]);
  });

  it('产品署名必须挂产品；other 必须写 titleNote', () => {
    expect(roleSchema.safeParse({ ...productRole, products: [] }).success).toBe(false);
    expect(roleSchema.safeParse({ ...companyRole, title: 'other' }).success).toBe(false);
    expect(roleSchema.safeParse({ ...companyRole, title: 'other', titleNote: '顾问' }).success).toBe(true);
  });

  it('公司职务不能挂产品 id', () => {
    expect(roleSchema.safeParse({ ...companyRole, products: ['a-first'] }).success).toBe(false);
  });

  it('接受核心策划 / 核心美术，以及可空外链', () => {
    expect(roleSchema.safeParse({ ...productRole, title: 'core-designer' }).success).toBe(true);
    expect(roleSchema.safeParse({ ...productRole, title: 'core-artist' }).success).toBe(true);
    const person = personSchema.parse({
      name: '张三',
      bio: '简介',
      roles: [companyRole],
      sources: [source],
      linkedin: 'https://www.linkedin.com/in/example',
      weibo: 'https://weibo.com/u/1',
    });
    expect(person.linkedin).toBe('https://www.linkedin.com/in/example');
    expect(person.maimai).toBeUndefined();
  });
});

describe('marketEntrySchema', () => {
  const base = {
    year: 2023,
    amountCNY: 5e9,
    kind: 'estimate',
    scope: '中国女性向游戏市场实际销售收入',
    source: { title: '测试来源', url: 'https://example.com' },
  };

  it('接受合法条目，verified 默认为 false', () => {
    const parsed = marketEntrySchema.parse(base);
    expect(parsed.verified).toBe(false);
  });

  it('拒绝非整数年份和非正数金额', () => {
    expect(marketEntrySchema.safeParse({ ...base, year: 2023.5 }).success).toBe(false);
    expect(marketEntrySchema.safeParse({ ...base, amountCNY: 0 }).success).toBe(false);
  });
});
