import { describe, expect, it } from 'vitest';
import { parseCompareIds, serializeCompareIds } from '../src/lib/compareQuery';

const known = ['happyelements', 'lingxi', 'papergames', 'youyi-shiguang'];

describe('parseCompareIds', () => {
  it('没有 c 参数时默认全选', () => {
    expect(parseCompareIds('', known)).toEqual(known);
    expect(parseCompareIds('foo=1', known)).toEqual(known);
  });

  it('只保留已知 id，忽略未知', () => {
    expect(parseCompareIds('c=lingxi,ghost,papergames', known)).toEqual(['lingxi', 'papergames']);
  });

  it('有 c 但没有任何已知 id 时是空选择，不回退全选', () => {
    expect(parseCompareIds('c=', known)).toEqual([]);
    expect(parseCompareIds('c=ghost', known)).toEqual([]);
  });
});

describe('serializeCompareIds', () => {
  it('按字母排序后用逗号连接', () => {
    expect(serializeCompareIds(['papergames', 'lingxi'])).toBe('lingxi,papergames');
  });
});
