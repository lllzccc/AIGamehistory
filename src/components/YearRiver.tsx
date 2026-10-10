import { withBase } from '../lib/paths';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from 'motion/react';
import type { GenreFilter, YearBucket } from '../lib/types';
import { bucketSize, filterBucket } from '../lib/data';
import { formatDate } from '../lib/dates';
import { companyKindLabel, genreLabel, timelineKindLabel } from '../lib/labels';
import ProductDrawer from './ProductDrawer';
import SourceLinks from './SourceLinks';

const FILTERS: { value: GenreFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'otome', label: genreLabel.otome },
  { value: 'dressup', label: genreLabel.dressup },
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

export default function YearRiver({ buckets }: { buckets: YearBucket[] }) {
  const [genre, setGenre] = useState<GenreFilter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const close = useCallback(() => setOpenId(null), []);
  const reduceMotion = useReducedMotion();

  const visible = useMemo(() => buckets.map((b) => filterBucket(b, genre)), [buckets, genre]);
  const open = useMemo(
    () => buckets.flatMap((b) => b.launches).find((p) => p.id === openId),
    [buckets, openId],
  );

  const reveal = (delay = 0) =>
    reduceMotion
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.2 },
          transition: { duration: 0.6, delay, ease },
        };

  return (
    <MotionConfig reducedMotion="user">
      <div className="sticky top-0 z-30 -mx-6 border-b border-ink/10 bg-paper/90 px-6 backdrop-blur sm:-mx-10 sm:px-10">
        <div role="group" aria-label="按品类筛选" className="flex flex-wrap items-center gap-2 py-4 text-sm">
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
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-24 text-center font-serif text-lg text-ink-soft">这个品类暂时还没有收录内容。</p>
      ) : (
        visible.map((b) => (
          <section
            key={b.year}
            id={`y${b.year}`}
            className="grid scroll-mt-20 gap-8 border-t border-ink/10 py-16 first:border-t-0 md:grid-cols-[11rem_1fr] md:gap-12"
          >
            <div className="md:sticky md:top-24 md:self-start">
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

      <AnimatePresence>{open && <ProductDrawer key={open.id} product={open} onClose={close} />}</AnimatePresence>
    </MotionConfig>
  );
}
