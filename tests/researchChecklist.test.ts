import { describe, expect, it } from 'vitest';
import { researchChecklistSchema } from '../src/lib/schema';
import { hasDeepCoverage, researchDirections } from '../src/lib/researchChecklist';
const source = { title: '官方材料', url: 'https://example.com' };
const items = () => researchDirections.map(d => ({ area: d.area, status: 'reviewed', checkedAt: '2026-10-10', scope: '已逐项核查', examined: [{ source, note: '已查全文' }], gaps: [] }));
const rounds = () => ['官网与公告', '商店与公开履历'].map(channel => ({ checkedAt: '2026-10-10', channel, note: '按清单补漏', foundKeyFacts: false, sources: [source] }));
describe('深挖清单验收', () => {
  it('五个方向与两个不同渠道均通过才达到深度收录', () => {
    const checklist = researchChecklistSchema.parse({ items: items(), supplementRounds: rounds() });
    expect(hasDeepCoverage(checklist)).toBe(true);
    expect(hasDeepCoverage(undefined)).toBe(false);
    expect(hasDeepCoverage({ ...checklist, supplementRounds: [] })).toBe(false);
    expect(hasDeepCoverage({ ...checklist, supplementRounds: [checklist.supplementRounds[0], checklist.supplementRounds[0]] })).toBe(false);
    checklist.supplementRounds[1].foundKeyFacts = true;
    expect(hasDeepCoverage(checklist)).toBe(false);
  });
  it('缺少方向、重复方向、没有来源的验收均拒绝', () => {
    expect(researchChecklistSchema.safeParse({ items: items().slice(1) }).success).toBe(false);
    const duplicate = items(); duplicate[0].area = duplicate[1].area;
    expect(researchChecklistSchema.safeParse({ items: duplicate }).success).toBe(false);
    const unsourced = items(); unsourced[0].examined = [];
    expect(researchChecklistSchema.safeParse({ items: unsourced }).success).toBe(false);
  });
  it('未知和未检索不能伪装为已验收，已查未找到可以保留', () => {
    const data = items();
    const gap = { question: '负责人姓名', status: 'pending', nextStep: '查官方署名', sources: [] };
    expect(researchChecklistSchema.safeParse({ items: data.map((i,n) => n === 0 ? { ...i, gaps: [gap] } : i) }).success).toBe(false);
    expect(researchChecklistSchema.safeParse({ items: data.map((i,n) => n === 0 ? { ...i, gaps: [{ ...gap, status: 'not-found' }] } : i) }).success).toBe(true);
  });
});
