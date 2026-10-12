import {describe,it,expect} from 'vitest';
import {matchesGameplay,filterGameplayBuckets} from '../src/lib/gameplay';
import {gameplaySchema} from '../src/lib/schema';
import {makeDataset} from './fixtures';
import {getYearBuckets} from '../src/lib/data';
const evidence={basis:'editorial' as const,checkedAt:'2026-10-12',note:'测试公开玩法依据',sources:[{title:'官方',url:'https://example.com'}]};
describe('gameplay filtering',()=>{
 it('uses intersection and keeps unclassified records explicit',()=>{
  const p=makeDataset().products[0];p.gameplay={...evidence,core:'cok-like',fusion:['match-3']};
  expect(matchesGameplay(p,'cok-like','match-3')).toBe(true);
  expect(matchesGameplay(p,'rok-like','match-3')).toBe(false);
  expect(matchesGameplay(p,'cok-like','merge')).toBe(false);
  expect(matchesGameplay(p,'unclassified','all')).toBe(false);
  expect(matchesGameplay({...p,gameplay:undefined},'unclassified','all')).toBe(true);
 });
 it('keeps cross-year company history but removes unrelated births and empty years',()=>{
  const ds=makeDataset();ds.products[0].gameplay={...evidence,core:'rok-like',fusion:[]};
  const buckets=getYearBuckets(ds,2026).reverse();
  const result=filterGameplayBuckets(buckets,'rok-like','all');
  expect(result.flatMap(b=>b.founded).map(c=>c.id)).toEqual(['alpha']);
  expect(result.flatMap(b=>b.launches).map(p=>p.id)).toEqual(['a-first']);
  expect(result.flatMap(b=>b.events).map(e=>e.id)).toEqual(['alpha-a-round']);
  expect(result.every((b,i)=>!i||b.year<result[i-1].year)).toBe(true);
  expect(filterGameplayBuckets(buckets,'all','all')).toBe(buckets);
 });
 it('returns a real empty state for impossible combinations',()=>{
  const ds=makeDataset();ds.products[0].gameplay={...evidence,core:'rok-like',fusion:[]};
  expect(filterGameplayBuckets(getYearBuckets(ds,2026),'rok-like','match-3')).toEqual([]);
 });
 it('includes publisher company history for matching products',()=>{
  const ds=makeDataset();ds.products[2].gameplay={...evidence,core:'cok-like',fusion:['merge']};
  const out=filterGameplayBuckets(getYearBuckets(ds,2026),'cok-like','merge');
  expect(out.flatMap(b=>b.founded).map(c=>c.id).sort()).toEqual(['alpha','beta']);
 });
 it('rejects labels without evidence and unknown tags',()=>{
  expect(gameplaySchema.safeParse({core:'rok-like',fusion:[]}).success).toBe(false);
  expect(gameplaySchema.safeParse({...evidence,core:'cok-like',fusion:['unknown']}).success).toBe(false);
 });
});

