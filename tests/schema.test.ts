import { describe, expect, it } from 'vitest';
import { companySchema, partialDate, productSchema } from '../src/lib/schema';

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

  it('流水默认为空数组', () => {
    expect(productSchema.parse(valid).revenue).toEqual([]);
  });
});
