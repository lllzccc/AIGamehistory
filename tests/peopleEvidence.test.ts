import { describe, expect, it } from 'vitest';
import { roleSchema } from '../src/lib/schema';
import { rolePeriodLabel, roleStatusLabel } from '../src/lib/labels';
const base = {company: 'papergames', scope: 'product', products: ['infinity-nikki'], title: 'producer', from: '2022'} as const;
describe('person evidence', () => {
  it('missing end date never confirms current employment', () => {
    const role = roleSchema.parse(base);
    expect(roleStatusLabel(role)).toBe('状态未知');
    expect(rolePeriodLabel(role)).toContain('结束时间未知');
  });
  it('active requires source and check date, and no departure date', () => {
    expect(roleSchema.safeParse({...base,status:'active'}).success).toBe(false);
    const role = {...base,status:'active',sources:[{title:'官方',url:'https://example.com'}],checkedAt:'2026-10-10'};
    expect(roleSchema.safeParse(role).success).toBe(true);
    expect(roleSchema.safeParse({...role,to:'2025'}).success).toBe(false);
  });
  it('appearance records are distinct from joining dates', () => {
    expect(rolePeriodLabel(roleSchema.parse({...base,dateBasis:'public-observation'}))).toContain('公开记录始于');
    expect(roleStatusLabel(roleSchema.parse({...base,to:'2025'}))).toBe('已离任');
  });
});