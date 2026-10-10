import { withBase } from '../lib/paths';
import { useEffect, useMemo, useRef, useState } from 'react';
import { scaleLinear } from 'd3-scale';
import { MotionConfig } from 'motion/react';
import type { ChronicleEvent, CompareLane, ProductCard } from '../lib/types';
import { compareThickness, representativeRevenue } from '../lib/data';
import { parseCompareIds, serializeCompareIds } from '../lib/compareQuery';
import { dateToNumber, formatDate } from '../lib/dates';
import { formatCNY } from '../lib/money';
import { revenueBasisLabel, timelineKindLabel } from '../lib/labels';

const LABEL_W = 148;
const PAD_X = 32;
const YEAR_W = 112;
const LANE_H = 108;
const AXIS_H = 64;

function eventFill(type: ChronicleEvent['type']): string {
  switch (type) {
    case 'funding':
    case 'ipo':
      return '#9E3B4D';
    case 'controversy':
      return '#1E1A17';
    case 'layoff':
    case 'departure':
    case 'rename':
      return '#A79E95';
    default:
      return '#5B524B';
  }
}

function sameSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

function writeUrl(ids: string[], allIds: string[]) {
  const url = new URL(window.location.href);
  if (sameSet(ids, allIds)) url.searchParams.delete('c');
  else url.searchParams.set('c', serializeCompareIds(ids));
  history.replaceState(null, '', url);
}

type Tip =
  | { kind: 'product'; x: number; y: number; product: ProductCard }
  | { kind: 'event'; x: number; y: number; event: ChronicleEvent };

export default function SwimLanes({ lanes, endYear }: { lanes: CompareLane[]; endYear: number }) {
  const allIds = useMemo(() => lanes.map((l) => l.company.id), [lanes]);
  const [selected, setSelected] = useState(allIds);
  const [tip, setTip] = useState<Tip | null>(null);
  const readUrl = useRef(false);

  useEffect(() => {
    if (!readUrl.current) {
      readUrl.current = true;
      setSelected(parseCompareIds(window.location.search, allIds));
      return;
    }
    writeUrl(selected, allIds);
  }, [selected, allIds]);

  const visible = lanes.filter((l) => selected.includes(l.company.id));
  const visibleProducts = visible.flatMap((l) => l.products);

  const dates = visible.flatMap((l) => [
    l.company.founded,
    ...l.products.map((p) => p.released),
    ...l.events.map((e) => e.date),
  ]);
  const start = dates.length === 0 ? endYear - 4 : Math.floor(Math.min(...dates.map(dateToNumber)));
  const end = endYear + 1;
  const years = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const width = LABEL_W + PAD_X * 2 + Math.max(1, years.length - 1) * YEAR_W;
  const height = AXIS_H + visible.length * LANE_H;
  const x = scaleLinear()
    .domain([start, end])
    .range([LABEL_W + PAD_X, width - PAD_X]);

  const toggle = (id: string) => {
    setSelected((cur) => (cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id]));
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <div role="group" aria-label="选择对比公司" className="flex flex-wrap gap-3 pb-8 text-sm">
          {lanes.map((l) => (
            <label key={l.company.id} className="flex cursor-pointer items-center gap-2 text-ink-soft">
              <input
                type="checkbox"
                checked={selected.includes(l.company.id)}
                onChange={() => toggle(l.company.id)}
              />
              <span className={selected.includes(l.company.id) ? 'text-ink' : ''}>{l.company.name}</span>
            </label>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mx-auto max-w-6xl px-6 pb-24 font-serif text-ink-soft sm:px-10">请选择至少一家公司</p>
      ) : (
        <div className="relative overflow-x-auto pb-24">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            width={width}
            height={height}
            role="img"
            aria-label="对比泳道"
          >
            {years.map((year) => (
              <g key={year}>
                <line x1={x(year)} x2={x(year)} y1={AXIS_H - 8} y2={height} className="stroke-ink/10" />
                <text
                  x={x(year)}
                  y={32}
                  textAnchor="middle"
                  fill="#A79E95"
                  fontFamily="Cormorant Garamond, serif"
                  fontSize={16}
                >
                  {year}
                </text>
              </g>
            ))}

            {visible.map((lane, i) => {
              const mid = AXIS_H + i * LANE_H + LANE_H / 2;
              return (
                <g key={lane.company.id}>
                  <line x1={LABEL_W} x2={width} y1={mid} y2={mid} className="stroke-ink/15" />
                  {lane.products.map((product) => {
                    const rev = product.series.at(-1) ?? representativeRevenue(product);
                    const faded = !!(rev?.partial || rev?.lowerBound);
                    const h = compareThickness(product, visibleProducts);
                    const x1 = x(dateToNumber(product.released));
                    const x2 = x(dateToNumber(product.shutdown ?? `${endYear}`));
                    const w = Math.max(8, x2 - x1);
                    return (
                      <a key={product.id} href={withBase(`/company/${product.developer}#works`)} aria-label={`《${product.name}》`}>
                        <rect
                          x={x1}
                          y={mid - h / 2}
                          width={w}
                          height={h}
                          rx={h / 2}
                          fill="#9E3B4D"
                          fillOpacity={faded ? 0.28 : 0.55}
                          stroke="#9E3B4D"
                          strokeDasharray={product.status === 'unknown' || rev?.kind === 'estimate' ? '4 3' : undefined}
                          onPointerEnter={(e) => setTip({ kind: 'product', x: e.clientX, y: e.clientY, product })}
                          onPointerLeave={() => setTip(null)}
                        />
                      </a>
                    );
                  })}
                  {lane.events.map((event) => (
                    <circle
                      key={event.id}
                      cx={x(dateToNumber(event.date))}
                      cy={mid}
                      r={5}
                      fill={eventFill(event.type)}
                      onPointerEnter={(e) => setTip({ kind: 'event', x: e.clientX, y: e.clientY, event })}
                      onPointerLeave={() => setTip(null)}
                    />
                  ))}
                </g>
              );
            })}
          </svg>

          <div className="pointer-events-none absolute inset-y-0 left-0 w-[148px] bg-gradient-to-r from-paper via-paper/95 to-transparent">
            {visible.map((lane, i) => (
              <a
                key={lane.company.id}
                href={withBase(`/company/${lane.company.id}`)}
                className="pointer-events-auto absolute left-6 truncate font-serif text-sm text-ink hover:text-rouge"
                style={{ top: AXIS_H + i * LANE_H + LANE_H / 2 - 10 }}
              >
                {lane.company.name}
              </a>
            ))}
          </div>

          {tip && (
            <div
              className="pointer-events-none fixed z-50 max-w-xs rounded-sm border border-ink/10 bg-paper px-4 py-3 text-sm shadow-sm"
              style={{ left: tip.x + 12, top: tip.y + 12 }}
            >
              {tip.kind === 'product' ? <ProductTip product={tip.product} endYear={endYear} /> : <EventTip event={tip.event} />}
            </div>
          )}
        </div>
      )}
    </MotionConfig>
  );
}

function ProductTip({ product, endYear }: { product: ProductCard; endYear: number }) {
  const rev = product.series.at(-1) ?? representativeRevenue(product);
  const until = product.shutdown ? formatDate(product.shutdown) : product.status === 'unknown' ? '结束时间及现状待核实（虚线不代表持续运营）' : `${endYear}年至今`;
  return (
    <div>
      <p className="font-serif text-ink">《{product.name}》</p>
      <p className="mt-1 text-ink-soft">
        {formatDate(product.released)}
        {' — '}
        {until}
      </p>
      {rev && (
        <p className="mt-2 text-ink">
          {formatCNY(rev.amountCNY)}
          {rev.basis ? ` · ${revenueBasisLabel[rev.basis]}` : ''}
          {rev.partial ? ' · 部分月份' : ''}
          {rev.lowerBound ? ' · 下限' : ''}
        </p>
      )}
      {!product.verified && <span className="unverified mt-2">待核实</span>}
    </div>
  );
}

function EventTip({ event }: { event: ChronicleEvent }) {
  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-mist">{timelineKindLabel[event.type]}</p>
      <p className="mt-1 font-serif text-ink">{event.summary}</p>
      <p className="mt-1 text-ink-soft">{formatDate(event.date)}</p>
      {!event.verified && <span className="unverified mt-2">待核实</span>}
    </div>
  );
}
