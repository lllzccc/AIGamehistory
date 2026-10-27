import { withBase } from '../lib/paths';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from 'motion/react';
import type { GenreFilter, YearBucket } from '../lib/types';
import { bucketSize, filterBucket } from '../lib/data';
import { formatDate } from '../lib/dates';
import { companyKindLabel, genreLabel, timelineKindLabel } from '../lib/labels';
import ProductDrawer from './ProductDrawer';
import GameplayTags from './GameplayTags';
import {coreGameplayLabels, fusionGameplayLabels, filterGameplayBuckets, type CoreFilter, type FusionFilter} from '../lib/gameplay';
import SourceLinks from './SourceLinks';
import { searchRiver } from '../lib/riverSearch';
import './YearRiver.css';

const FILTERS: { value: GenreFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'otome', label: genreLabel.otome },
  { value: 'dressup', label: genreLabel.dressup },
  { value: 'palace', label: genreLabel.palace },
  { value: 'court', label: genreLabel.court },

  { value: 'minigame', label: '小游戏渠道' },
  { value: 'interactive', label: genreLabel.interactive },
];

const ease = [0.22, 1, 0.36, 1] as const;

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-5 text-xs tracking-[0.3em] text-mist">{label}</h3>
      {children}
    </div>
  );
}

export default function YearRiver({ buckets, chronicle }: { buckets: YearBucket[]; chronicle?: string }) {
  const [core, setCore] = useState<CoreFilter>('all');
  const [fusion, setFusion] = useState<FusionFilter>('all');
  const [genre, setGenre] = useState<GenreFilter>('all');
  const [query, setQuery] = useState('');
  const [activeYear, setActiveYear] = useState<number | null>(null);
  const riverRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const yearsRef = useRef<HTMLDivElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const close = useCallback(() => setOpenId(null), []);
  const reduceMotion = useReducedMotion();

  const visible = useMemo(() => searchRiver(
    (chronicle === 'slg' || chronicle === 'casual') ? filterGameplayBuckets(buckets, core, fusion) : buckets.map((b) => filterBucket(b, genre)),
    query,
  ), [buckets, genre, chronicle, core, fusion, query]);

  useEffect(() => {
    const tools = toolsRef.current;
    if (!tools) return;
    const observer = new ResizeObserver(() => {
      riverRef.current?.style.setProperty('--river-tools-height', `${tools.offsetHeight}px`);
    });
    observer.observe(tools);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const sections = riverRef.current?.querySelectorAll<HTMLElement>('[data-river-year]');
      if (!sections?.length) { setActiveYear(null); return; }
      const offset = (toolsRef.current?.offsetHeight ?? 0) + (window.innerWidth < 1440 ? 80 : 24);
      let year = Number(sections[0].dataset.riverYear);
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= offset + 2) year = Number(section.dataset.riverYear);
        else break;
      }
      setActiveYear(year);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const observer = new ResizeObserver(schedule);
    if (riverRef.current) observer.observe(riverRef.current);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [visible]);

  useEffect(() => {
    const list = yearsRef.current;
    const link = list?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!list || !link) return;
    if (window.innerWidth >= 1440) {
      if (link.offsetTop < list.scrollTop) list.scrollTop = link.offsetTop;
      else if (link.offsetTop + link.offsetHeight > list.scrollTop + list.clientHeight)
        list.scrollTop = link.offsetTop + link.offsetHeight - list.clientHeight;
    } else {
      if (link.offsetLeft < list.scrollLeft) list.scrollLeft = link.offsetLeft;
      else if (link.offsetLeft + link.offsetWidth > list.scrollLeft + list.clientWidth)
        list.scrollLeft = link.offsetLeft + link.offsetWidth - list.clientWidth;
    }
  }, [activeYear]);
  const filteredCount = visible.reduce((n,b) => n + b.launches.length, 0);
  const fusionOptions = Object.entries(fusionGameplayLabels).filter(([tag]) => buckets.some(b => b.launches.some(p => p.gameplay?.fusion.includes(tag as Exclude<FusionFilter, 'all'>))));
  const open = useMemo(
    () => buckets.flatMap((b) => b.launches).find((p) => p.id === openId),
    [buckets, openId],
  );

  const reveal = (delay = 0) =>
    reduceMotion
      ? { initial: false as const, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
      : {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.2 },
          transition: { duration: 0.6, delay, ease },
        };

  return (
    <MotionConfig reducedMotion="user">
      <div ref={riverRef} className="year-river">
      <div ref={toolsRef} className="sticky top-0 z-30 -mx-6 border-b border-ink/10 bg-paper/90 px-6 backdrop-blur sm:-mx-10 sm:px-10">
        <div className="river-search">
          <label htmlFor="river-keyword" className="text-xs tracking-widest text-ink-soft">关键词搜索</label>
          <div className="river-search-field">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
            <input id="river-keyword" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索产品或公司名称" autoComplete="off" />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="清除关键词">清除</button>}
          </div>
          {query.trim() && <span role="status" className="text-xs text-ink-soft">找到 {visible.reduce((n, b) => n + bucketSize(b), 0)} 条记录</span>}
        </div>
        {chronicle === 'slg' ? <div className="py-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[140px] flex-1 sm:min-w-0 sm:flex-none"><span className="mb-1 block text-xs tracking-wide text-mist">核心玩法</span><select aria-label="核心玩法" value={core} onChange={e => setCore(e.target.value as CoreFilter)} className="w-full min-w-0 border border-ink/15 bg-paper px-3 py-2 text-sm text-ink sm:w-56"><option value="all">全部体系</option>{Object.entries(coreGameplayLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}<option value="unclassified">待分类</option></select></label>
            <label className="min-w-[140px] flex-1 sm:min-w-0 sm:flex-none"><span className="mb-1 block text-xs tracking-wide text-mist">融合玩法</span><select aria-label="融合玩法" value={fusion} onChange={e => setFusion(e.target.value as FusionFilter)} className="w-full min-w-0 border border-ink/15 bg-paper px-3 py-2 text-sm text-ink sm:w-40"><option value="all">全部融合玩法</option>{fusionOptions.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <span role="status" className="text-xs text-mist">{filteredCount} 条产品版本</span>
            {(core !== 'all' || fusion !== 'all') && <button type="button" onClick={() => {setCore('all');setFusion('all');}} className="py-2 text-xs text-rouge underline underline-offset-4">清除筛选</button>}
          </div>
          <details className="mt-3 text-xs leading-relaxed text-ink-soft"><summary className="cursor-pointer text-mist">分类口径</summary><p className="mt-2 max-w-3xl">COK-like侧重城建、行军与联盟战争；ROK-like侧重开放地图中的自由行军与即时操作；赛季地块侧重占地、赛季与领土争夺。融合玩法单独标注，可与核心玩法组合筛选。这是本站依据公开玩法描述作的整理，不是官方分类或研发传承关系；依据与核查日期见产品详情，未确认的保留待分类。</p></details>
        </div> : chronicle === 'casual' ? <div className="py-4"><div role="group" aria-label="休闲玩法筛选" className="flex flex-wrap items-center gap-2 text-sm">{[['all','全部休闲'],['merge-2','二合 · Merge-2'],['merge-3','三合 · Merge-3'],['match-3','三消'],['simulation','模拟经营'],['merge','合成待细分']].map(([value,label]) => <button key={value} type="button" aria-pressed={fusion===value} onClick={()=>setFusion(value as FusionFilter)} className={'rounded-full border px-4 py-1.5 '+(fusion===value?'border-ink bg-ink text-paper':'border-ink/15 text-ink-soft hover:border-rouge')}>{label}</button>)}</div><p className="mt-3 text-xs leading-relaxed text-ink-soft">{filteredCount} 条产品版本 · 二合按两个相同物品升级的主循环分类；三合单列。公司保留跨品类档案，玩法标签不代表全部团队经历。</p></div> : (        <div role="group" aria-label="按品类筛选" className="flex flex-wrap items-center gap-2 py-4 text-sm">
          <span className="mr-2 text-xs tracking-[0.3em] text-mist">品类</span>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={genre === f.value}
              onClick={() => setGenre(f.value)}
              className={`rounded-full border px-4 py-1.5 transition ${
                genre === f.value
                  ? 'border-ink bg-ink text-paper'
                  : 'border-ink/15 text-ink-soft hover:border-rouge hover:text-rouge'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>) }
      </div>

      <div className="river-body">
      {visible.length > 0 && <aside className="river-directory">
        <nav aria-label="时间目录" className="river-directory-inner">
          <p className="river-directory-title">时间目录</p>
          <div ref={yearsRef} className="river-years">
            {visible.map(b => <a key={b.year} href={`#y${b.year}`} aria-current={activeYear === b.year ? 'location' : undefined}
              onClick={e => {
                e.preventDefault();
                const section = document.getElementById(`y${b.year}`);
                if (!section) return;
                history.replaceState(null, '', `#y${b.year}`);
                section.scrollIntoView({ behavior: reduceMotion || e.detail === 0 ? 'instant' : 'smooth', block: 'start' });
                section.focus({ preventScroll: true });
              }}>
              <span>{b.year}</span><span className="river-year-count">{bucketSize(b)}</span>
            </a>)}
          </div>
        </nav>
      </aside>}
      {visible.length === 0 ? (
        <p className="py-24 text-center font-serif text-lg text-ink-soft">没有符合当前搜索或筛选的记录，请调整关键词或清除筛选。</p>
      ) : (
        visible.map((b) => (
          <section
            key={b.year}
            id={`y${b.year}`}
            data-river-year={b.year}
            tabIndex={-1}
            className="river-year-section grid gap-8 border-t border-ink/10 py-16 first:border-t-0 md:grid-cols-[11rem_1fr] md:gap-12"
          >
            <div className="river-year-heading md:sticky md:self-start">
              <h2 className="font-display text-6xl leading-none text-ink md:text-8xl">{b.year}</h2>
              <p className="mt-3 text-xs tracking-[0.3em] text-mist">{bucketSize(b)} 条记录</p>
            </div>

            <div className="space-y-14">
              {bucketSize(b) === 0 && (
                <p className="text-sm text-ink-soft">本年暂无收录</p>
              )}
              {b.founded.length > 0 && (
                <Group label="新成立">
                  <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-4">
                    {b.founded.map((c, i) => (
                      <motion.li key={c.id} {...reveal(i * 0.06)}>
                        <a
                          href={withBase(`/company/${c.id}`)}
                          className="company-record group flex h-60 items-start gap-4 border border-ink/10 bg-paper-deep/40 p-5 transition hover:border-rouge/40"
                        >
                          {c.logo ? (
                            <img src={c.logo} alt="" className="h-12 w-12 shrink-0 object-contain" />
                          ) : (
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rouge-soft font-serif text-lg text-rouge">
                              {c.name.slice(0, 1)}
                            </span>
                          )}
                          <span className="flex h-full min-w-0 flex-1 flex-col">
                            <span className="line-clamp-2 min-h-14 font-serif text-lg leading-7 text-ink transition group-hover:text-rouge">
                              {c.name}
                            </span>
                            <span className="mt-1 line-clamp-2 h-8 shrink-0 text-xs leading-4 tracking-wide text-mist">
                              {formatDate(c.founded)} · {companyKindLabel[c.kind]}
                            </span>
                            <span className="mt-2 line-clamp-3 h-[4.125rem] shrink-0 text-sm leading-[1.375rem] text-ink-soft">{c.tagline}</span>
                            <span className="mt-auto block h-6">{!c.verified && <span className="unverified">待核实</span>}</span>
                          </span>
                        </a>
                      </motion.li>
                    ))}
                  </ul>
                </Group>
              )}

              {b.launches.length > 0 && (
                <Group label="新作上线">
                  <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
                    {b.launches.map((p, i) => {
                      const art = p.keyArt ?? p.cover;
                      return (
                        <motion.li key={p.id} {...reveal((i % 2) * 0.08)}>
                          <button
                            type="button"
                            onClick={() => setOpenId(p.id)}
                            aria-label={`${p.name}，查看详情`}
                            className="group block w-full text-left"
                          >
                            <span className="relative block aspect-[16/10] overflow-hidden bg-paper-deep">
                              {art ? (
                                <img
                                  src={art}
                                  style={{ objectPosition: p.artPosition ?? 'top' }}
                                  alt=""
                                  loading="lazy"
                                  className="h-full w-full object-cover object-top transition duration-700 ease-out motion-safe:group-hover:scale-[1.03]"
                                />
                              ) : (
                                <span className="flex h-full items-center justify-center font-display text-6xl text-ink/10">
                                  {b.year}
                                </span>
                              )}
                              <span className="absolute top-3 left-3 bg-paper/90 px-2 py-1 text-xs tracking-widest text-ink-soft">
                                {genreLabel[p.genre]}
                              </span>
                            </span>
                            <span className="mt-4 flex items-baseline justify-between gap-4">
                              <span className="font-serif text-xl text-ink transition group-hover:text-rouge">
                                {p.name}
                              </span>
                              <span className="shrink-0 font-display text-sm text-mist">{formatDate(p.released)}</span>
                            </span>
                            <span className="mt-1 block text-sm text-ink-soft">
                              研发 {p.developerName}
                              {p.publisherName !== p.developerName && ` · 发行 ${p.publisherName}`}
                            </span>
                            <GameplayTags product={p} />
                            {!p.verified && <span className="unverified mt-2">待核实</span>}
                          </button>
                        </motion.li>
                      );
                    })}
                  </ul>
                </Group>
              )}

              {b.events.length > 0 && (
                <Group label="大事记">
                  <ol className="space-y-5">
                    {b.events.map((e, i) => (
                      <motion.li
                        key={e.id}
                        {...reveal(Math.min(i * 0.05, 0.3))}
                        className="grid grid-cols-[6.5rem_1fr] gap-4 border-b border-ink/5 pb-5 sm:grid-cols-[8rem_1fr]"
                      >
                        <p className="font-display text-sm text-mist">
                          {formatDate(e.date)}
                          <span className="mt-1 block font-sans text-xs tracking-[0.2em] text-rouge">
                            {timelineKindLabel[e.kind]}
                          </span>
                        </p>
                        <div>
                          <p className="font-serif leading-relaxed text-ink">{e.label}</p>
                          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mist">
                            {e.companies.map((c) => (
                              <a key={c.id} href={withBase(`/company/${c.id}`)} className="text-ink-soft transition hover:text-rouge">
                                {c.name}
                              </a>
                            ))}
                            <SourceLinks sources={e.sources} />
                            {!e.verified && <span className="unverified">待核实</span>}
                          </p>
                        </div>
                      </motion.li>
                    ))}
                  </ol>
                </Group>
              )}
            </div>
          </section>
        ))
      )}

      </div>
      </div>
      <AnimatePresence>{open && <ProductDrawer key={open.id} product={open} onClose={close} />}</AnimatePresence>
    </MotionConfig>
  );
}
