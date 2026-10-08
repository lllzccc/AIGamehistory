import { describe, expect, it } from 'vitest';
import { compareDates, dateToNumber, formatDate, periodToNumber, yearOf } from '../src/lib/dates';

describe('dates', () => {
  it('yearOf 取年份', () => {
    expect(yearOf('2017-12-20')).toBe(2017);
    expect(yearOf('2013')).toBe(2013);
  });

  it('compareDates 按时间先后排序，同年时只写年份的排在前面', () => {
    const sorted = ['2019', '2017-12', '2017', '2017-01-05'].sort(compareDates);
    expect(sorted).toEqual(['2017', '2017-01-05', '2017-12', '2019']);
  });

  it('formatDate 按精度输出中文日期', () => {
    expect(formatDate('2013')).toBe('2013年');
    expect(formatDate('2013-05')).toBe('2013年5月');
    expect(formatDate('2013-05-07')).toBe('2013年5月7日');
  });

  it('dateToNumber 把日期换算成小数年份', () => {
    expect(dateToNumber('2017')).toBe(2017);
    expect(dateToNumber('2017-07')).toBe(2017.5);
    expect(dateToNumber('2017-01-01')).toBe(2017);
  });

  it('periodToNumber 支持年度和季度', () => {
    expect(periodToNumber('2024')).toBe(2024);
    expect(periodToNumber('2024-Q1')).toBe(2024);
    expect(periodToNumber('2024-Q3')).toBe(2024.5);
  });
});
