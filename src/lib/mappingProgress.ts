import type { Dataset } from './types';
import { researchDirections, hasDeepCoverage } from './researchChecklist';
export interface PlanEntry { stage: string; done: string; next: string }
export interface MappingPlan { updatedAt: string; order: string[]; companies: Record<string, PlanEntry> }
export interface MappingRoster { id: string; name: string; products: string[]; note: string; checkedAt: string; source: {title:string;url:string} }
export interface MappingRow {
 id:string; name:string; aliases:string[]; volumes:string[]; archive:boolean; stage:string; done:string; next:string; checkedAt:string;
 products:{id:string;name:string;volumes:string[]}[]; people:{id:string;volumes:string[]}[];
 directions:{area:string;title:string;status:string;scope:string;checkedAt?:string;examined:{source:{title:string;url:string};note:string}[];gaps:{question:string;status:string;nextStep:string}[]}[];
 leads:string[]; source?:{title:string;url:string};
}
export function orderedIds(ids:string[], preferred:string[]):string[] {
 const known=new Set(ids);return [...new Set([...preferred.filter(id=>known.has(id)),...ids])];
}
export function readOrder(value:unknown, ids:string[]):string[] {
 if(!Array.isArray(value)||!value.every(id=>typeof id==='string')||new Set(value).size!==value.length||value.some(id=>!ids.includes(id))) throw Error('顺序文件包含重复或未知公司，请重新导出。');
 return orderedIds(ids,value);
}
export function buildMappingRows(ds:Dataset, rosters:Record<string,MappingRoster[]>,plan:MappingPlan):MappingRow[] {
 const ids=orderedIds([...ds.companies.map(c=>c.id),...Object.values(rosters).flatMap(r=>r.map(x=>x.id))],plan.order);
 return ids.map(id=>{
  const c=ds.companies.find(c=>c.id===id);const rosterEntries=Object.entries(rosters).flatMap(([volume,rs])=>rs.filter(r=>r.id===id).map(r=>({...r,volume})));const r=rosterEntries[0];
  const products=ds.products.filter(p=>p.developer===id||p.publisher===id).map(p=>({id:p.id,name:p.name,volumes:p.chronicles??['female']}));
  const volumes=[...new Set([...products.flatMap(p=>p.volumes),...rosterEntries.map(r=>r.volume)])];
  const people=ds.people.flatMap(p=>{const roles=p.roles.filter(r=>r.company===id);const vs=[...new Set(roles.flatMap(r=>r.scope==='company'?(r.specialties?.length?ds.products.filter(p=>(p.developer===id||p.publisher===id)&&r.specialties!.includes(p.genre)).flatMap(p=>p.chronicles??['female']):volumes):products.filter(p=>r.products.includes(p.id)).flatMap(p=>p.volumes)))];return roles.length?[{id:p.id,volumes:vs}]:[];});
  const entry=plan.companies[id];const checklist=c?.researchChecklist;
  const directions=researchDirections.map(d=>{const item=checklist?.items.find(i=>i.area===d.area);return {area:d.area,title:d.title,status:item?.status??'pending',scope:item?.scope??'尚未建立本方向检索记录。',checkedAt:item?.checkedAt,examined:item?.examined??[],gaps:item?.gaps??[]};});
  const dates=[...directions.flatMap(d=>d.checkedAt?[d.checkedAt]:[]),...ds.people.flatMap(p=>p.roles.filter(r=>r.company===id).map(r=>r.checkedAt)),...rosterEntries.map(r=>r.checkedAt)].filter((x):x is string=>!!x).sort();
  return {id,name:c?.name??r?.name??id,aliases:c?.aliases??[],volumes,archive:!!c,stage:hasDeepCoverage(checklist)?'范围已验收':entry?.stage??(c?'已建档':'仅列名'),done:entry?.done??(c?'已建立公司档案；具体检索范围见五方向记录。':r?.note??'等待核查主体与代表产品。'),next:entry?.next??directions.flatMap(d=>d.gaps.map(g=>g.nextStep))[0]??'逐方向核对公开资料，补产品、版本、团队和商业口径。',checkedAt:dates.at(-1)??'未记录',products,people,directions,leads:[...new Set(rosterEntries.flatMap(r=>r.products))],source:r?.source};
 }).filter(r=>r.volumes.length>0);
}
