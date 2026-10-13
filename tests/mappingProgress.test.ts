import {describe,it,expect} from 'vitest';
import {orderedIds,readOrder,buildMappingRows} from '../src/lib/mappingProgress';
import type {Dataset} from '../src/lib/types';
describe('mapping priorities and evidence coverage',()=>{
 it('keeps saved priorities and appends newly added companies',()=>expect(orderedIds(['a','b','c'],['b','retired','b'])).toEqual(['b','a','c']));
 it('rejects corrupt orders without accepting duplicates or unknown ids',()=>{for(const order of [['a','a'],['unknown'],[1],null])expect(()=>readOrder(order,['a','b'])).toThrow();});
 it('can import a shorter order without dropping existing companies',()=>expect(readOrder(['b'],['a','b','c'])).toEqual(['b','a','c']));
 it('does not count unarchived roster leads as products or mark them deeply mapped',()=>{
  const ds={companies:[],products:[],people:[],events:[],market:[]} as Dataset;
  const [r]=buildMappingRows(ds,{slg:[{id:'a',name:'待核公司',products:['代表产品'],note:'待查研发主体',checkedAt:'2026-10-13',source:{title:'官方',url:'https://example.com'}}]},{updatedAt:'2026-10-13',order:[],companies:{}});
  expect(r.products).toHaveLength(0);expect(r.leads).toEqual(['代表产品']);expect(r.stage).toBe('仅列名');expect(r.archive).toBe(false);
 });
 it('links a company to both volumes while retaining each product scope',()=>{
  const ds={companies:[{id:'a',name:'公司',aliases:[]}],products:[{id:'p',name:'策略',developer:'a',publisher:'a',chronicles:['slg']},{id:'q',name:'换装',developer:'a',publisher:'a',chronicles:['female']}],people:[{id:'x',roles:[{company:'a',scope:'product',products:['p'],checkedAt:'2026-10-12'}]}],events:[],market:[]} as unknown as Dataset;
  const [r]=buildMappingRows(ds,{}, {updatedAt:'2026-10-13',order:[],companies:{}});expect(r.volumes).toEqual(['slg','female']);expect(r.products).toHaveLength(2);expect(r.people[0].volumes).toEqual(['slg']);expect(r.stage).not.toBe('范围已验收');
 });
});
