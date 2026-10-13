import {useEffect,useMemo,useState} from 'react';
import type {MappingPlan,MappingRow} from '../lib/mappingProgress';
import {orderedIds,readOrder} from '../lib/mappingProgress';
import {withBase} from '../lib/paths';
import './MappingProgress.css';
const key='chronicle-mapping-order-v1';
const volumes=[['slg','SLG'],['female','女性向'],['casual','休闲'],['all','全部公司']];
const labels:Record<string,string>={pending:'未登记',partial:'补充中',reviewed:'范围已核查'};
function status(d:MappingRow['directions'][number]) {return d.status==='pending'&&d.examined.length?'已查·待补清单':labels[d.status]??'未登记';}
export default function MappingProgress({rows,plan}:{rows:MappingRow[];plan:MappingPlan}) {
 const ids=useMemo(()=>rows.map(r=>r.id),[rows]);
 const [order,setOrder]=useState(()=>orderedIds(ids,plan.order));const [ready,setReady]=useState(false);const [notice,setNotice]=useState('');
 const [volume,setVolume]=useState('slg');const [query,setQuery]=useState('');const [stage,setStage]=useState('all');
 useEffect(()=>{try{const saved=localStorage.getItem(key);if(saved)setOrder(readOrder(JSON.parse(saved),ids));}catch{setNotice('旧顺序无法读取，已使用默认计划。');}setReady(true);},[ids]);
 useEffect(()=>{if(ready)try{localStorage.setItem(key,JSON.stringify(order));}catch{setNotice('浏览器无法保存顺序，请导出计划留存。');}},[order,ready]);
 const inVolume=rows.filter(r=>volume==='all'||r.volumes.includes(volume));
 const filtered=order.flatMap(id=>{const r=inVolume.find(r=>r.id===id);if(!r||stage!=='all'&&r.stage!==stage)return [];const text=[r.name,...r.aliases,...r.leads,...r.products.map(p=>p.name)].join(' ').toLowerCase();return text.includes(query.trim().toLowerCase())?[r]:[];});
 const stages=[...new Set(inVolume.map(r=>r.stage))];const deep=inVolume.filter(r=>r.stage==='多轮深挖').length;const accepted=inVolume.filter(r=>r.stage==='范围已验收').length;
 const countProducts=(r:MappingRow)=>r.products.filter(p=>volume==='all'||p.volumes.includes(volume)).length;
 const countPeople=(r:MappingRow)=>r.people.filter(p=>volume==='all'||p.volumes.includes(volume)).length;
 function move(id:string,delta:number){setOrder(o=>{const i=o.indexOf(id),j=i+delta;if(j<0||j>=o.length)return o;const n=[...o];[n[i],n[j]]=[n[j],n[i]];return n;});setNotice('顺序已调整，保存在当前浏览器。');}
 function first(id:string){setOrder(o=>[id,...o.filter(x=>x!==id)]);setNotice('已设为下一家，保存在当前浏览器。');}
 function download(){const blob=new Blob([JSON.stringify({...plan,updatedAt:new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'}),order},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='mapping-plan.json';a.click();URL.revokeObjectURL(url);setNotice('计划已导出，可用于同步研究顺序。');}
 async function importPlan(file?:File){if(!file)return;try{const d=JSON.parse(await file.text());setOrder(readOrder(d.order,ids));setNotice('已导入顺序，保存在当前浏览器。');}catch(e){setNotice(e instanceof Error?e.message:'无法读取计划文件。');}}
 return <div className="mapping-page">
  <div className="mapping-heading"><p className="mapping-eyebrow">研究工作台 / MAPPING</p><h1>公司计划与进度</h1><p>看清已经查到哪里，再决定下一家。</p></div>
  <div className="mapping-overview"><span>当前范围 <b>{inVolume.length}</b> 家</span><span>已建档 <b>{inVolume.filter(r=>r.archive).length}</b> 家</span><span>多轮深挖 <b>{deep}</b> 家</span><span>范围已验收 <b>{accepted}</b> 家</span></div>
  <p className="mapping-explanation">多轮深挖表示已做过多轮重点补充，不代表信息穷尽。五方向记录来自公司档案；记录数量与完整度不等同，跨卷公司共用公司级清单。</p>
  <div className="mapping-toolbar"><div className="mapping-tabs" role="group" aria-label="编年史范围">{volumes.map(([id,name])=><button key={id} aria-pressed={volume===id} onClick={()=>{setVolume(id);setStage('all');}}>{name}</button>)}</div><div className="mapping-plan-actions"><button onClick={download}>导出计划 ↓</button><label className="mapping-import">导入顺序<input type="file" accept=".json,application/json" onChange={e=>void importPlan(e.target.files?.[0])}/></label><button onClick={()=>{setOrder(orderedIds(ids,plan.order));setNotice('已恢复默认研究顺序。');}}>恢复默认</button></div></div>
  <div className="mapping-filters"><label><span className="sr-only">搜索公司或产品</span><input placeholder="搜索公司或代表产品" value={query} onChange={e=>setQuery(e.target.value)}/></label><label><span className="sr-only">研究阶段</span><select value={stage} onChange={e=>setStage(e.target.value)}><option value="all">所有阶段</option>{stages.map(s=><option key={s}>{s}</option>)}</select></label></div>
  <div className="mapping-queue-note"><span>显示 {filtered.length} 家 · 默认计划核对于 {plan.updatedAt}</span><span>调整顺序保存在当前浏览器；导出计划可同步给后续研究任务。</span></div><p className="mapping-notice" role="status" aria-live="polite">{notice||'点击“设为下一家”，即可调整研究优先级。'}</p>
  <div className="mapping-list">{filtered.length===0?<p className="mapping-empty">没有匹配的公司，试试其他关键词或阶段。</p>:filtered.map((r,i)=><article className="mapping-company" key={r.id}>
    <div className="mapping-company-top"><div className="mapping-title"><span className="mapping-index">{String(i+1).padStart(2,'0')}</span><div>{r.archive?<a className="mapping-company-link" href={withBase('/company/'+r.id+'/')}>{r.name} ↗</a>:<h2>{r.name}</h2>}<span className="mapping-stage">{r.stage}</span></div></div><div className="mapping-order-controls"><button onClick={()=>first(r.id)} disabled={order[0]===r.id} aria-label={'设为下一家：'+r.name}>设为下一家</button><button onClick={()=>move(r.id,-1)} disabled={order.indexOf(r.id)===0} aria-label={'上移：'+r.name}>↑</button><button onClick={()=>move(r.id,1)} disabled={order.indexOf(r.id)===order.length-1} aria-label={'下移：'+r.name}>↓</button></div></div>
    <div className="mapping-row-main"><div className="mapping-research-copy"><p><span>已经做了</span>{r.done}</p><p className="mapping-next"><span>下一步</span>{r.next}</p></div><div className="mapping-coverage"><div className="mapping-directions">{r.directions.map(d=><div key={d.area} className={'mapping-direction '+(d.status==='pending'&&!d.examined.length?'is-pending':'is-started')}><span>{d.title}</span><b>{status(d)}</b></div>)}</div><p className="mapping-counts">{countProducts(r)} 款已建档产品 · {countPeople(r)} 位公开署名人物 <span>最近记录 {r.checkedAt}</span></p></div></div>
    <details className="mapping-details"><summary>查看已查范围与缺口</summary>{r.leads.length>0&&<p>名录产品线索：{r.leads.join(" · ")}（未建档线索不计入产品数量）</p>}<div className="mapping-detail-grid">{r.directions.map(d=><section key={d.area}><h3>{d.title} <small>{status(d)}</small></h3><p>{d.scope}</p>{d.examined.length>0?<ul>{d.examined.slice(0,3).map((x,j)=><li key={j}><a href={x.source.url} target="_blank" rel="noreferrer">{x.source.title} ↗</a></li>)}</ul>:<p className="mapping-muted">清单尚未登记检索证据；不能据此断言没有信息。</p>}{d.examined.length>3&&<p className="mapping-muted">另有 {d.examined.length-3} 项检索记录，见公司页末清单。</p>}{d.gaps.slice(0,2).map((g,j)=><p className="mapping-gap" key={j}>待补：{g.question} {g.nextStep}</p>)}</section>)}</div>{r.source&&<p><a href={r.source.url} target="_blank" rel="noreferrer">名录依据：{r.source.title} ↗</a></p>}</details>
  </article>)}</div>
  <div className="mapping-standard"><h2>什么时候算达标？</h2><p>公司沿革、产品全集、生命周期、人员团队、商业表现五方向都有明确检索范围与证据；剩余缺口写清“未查 / 未找到 / 有分歧 / 暂不可读”。再用两个不同渠道补检，连续两轮没有关键新增，才标记“范围已验收”。未来有新资料仍继续补充。</p><a href={withBase('/chronicle/'+(volume==='all'?'slg':volume)+'/')}>回到编年史 ↗</a></div>
 </div>;
}
