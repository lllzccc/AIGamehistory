import { describe, expect, it } from 'vitest';
import { makeDataset } from './fixtures';
import { selectChronicle } from '../src/lib/chronicles';
import { getCompanyView } from '../src/lib/data';
import { buildMappingRows } from '../src/lib/mappingProgress';
import { productSchema } from '../src/lib/schema';
describe('跨品类公司与项目人员', () => {
 it('公司完整收录RPG，分卷不把RPG作品及其制作人算作SLG', () => {
  const ds=makeDataset();
  ds.products[0].chronicles=['slg']; ds.products[0].genre='strategy';
  ds.products[1].chronicles=[]; ds.products[1].genre='rpg';
  ds.people[1].roles=[{...ds.people[1].roles[0],company:'alpha',scope:'product',products:[ds.products[1].id]}, {...ds.people[1].roles[0],company:'alpha',scope:'company',products:[],specialties:['rpg']}];
  expect(productSchema.safeParse(ds.products[1]).success).toBe(true);
  const company=getCompanyView(ds,'alpha');
  expect(company.products.map(p=>p.id)).toContain(ds.products[1].id);
  expect(company.talentMap.find(g=>g.product.id===ds.products[1].id)?.credits.map(c=>c.person.id)).toContain('producer');
  expect(selectChronicle(ds,'slg').people.map(p=>p.id)).not.toContain('producer');
  const row=buildMappingRows(ds,{}, {updatedAt:'2026-10-13',order:[],companies:{}}).find(r=>r.id==='alpha')!;
  expect(row.people.find(p=>p.id==='producer')?.volumes).toEqual([]);
  expect(row.people.map(p=>p.id)).toContain('producer');
  for(const id of ['female','casual','slg'] as const) expect(selectChronicle(ds,id).products.map(p=>p.id)).not.toContain(ds.products[1].id);
 });
});
