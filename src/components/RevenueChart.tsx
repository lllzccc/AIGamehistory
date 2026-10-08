import { useState } from 'react';
import { scaleLinear } from 'd3-scale';
import type { RevenuePoint } from '../lib/types';
import { formatCNY } from '../lib/money';

const W = 520;
const H = 220;
const M = { top: 16, right: 16, bottom: 32, left: 72 };

export default function RevenueChart({ series }: { series: RevenuePoint[] }) {
  const [active, setActive] = useState(series.length - 1);
  const first = series[0].x;
  const last = series[series.length - 1].x;
  const x = scaleLinear()
    .domain(first === last ? [first - 1, last + 1] : [first, last])
    .range([M.left, W - M.right]);
  const y = scaleLinear()
    .domain([0, Math.max(...series.map((p) => p.amountCNY))])
    .nice(4)
    .range([H - M.bottom, M.top]);
  const labelStep = Math.ceil(series.length / 8);
  const hasEstimate = series.some((p) => p.kind === 'estimate');
  const point = series[active];

  return (
    <figure className="mt-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" role="img" aria-label="营收流水折线图">
        {y.ticks(4).map((t) => (
          <g key={t}>
            <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} stroke="currentColor" className="text-ink/10" />
            <text x={M.left - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-mist text-[11px]">
              {formatCNY(t)}
            </text>
          </g>
        ))}

        {series.map((p, i) =>
          i % labelStep === 0 ? (
            <text key={p.period} x={x(p.x)} y={H - 8} textAnchor="middle" className="fill-mist font-display text-[12px]">
              {p.period}
            </text>
          ) : null,
        )}

        {series.slice(1).map((p, i) => {
          const a = series[i];
          const dashed = a.kind === 'estimate' || p.kind === 'estimate';
          return (
            <line
              key={p.period}
              x1={x(a.x)}
              y1={y(a.amountCNY)}
              x2={x(p.x)}
              y2={y(p.amountCNY)}
              stroke="var(--color-rouge)"
              strokeWidth={1.75}
              strokeDasharray={dashed ? '5 4' : undefined}
            />
          );
        })}

        {series.map((p, i) => (
          <circle
            key={p.period}
            cx={x(p.x)}
            cy={y(p.amountCNY)}
            r={active === i ? 5.5 : 3.5}
            fill={p.kind === 'official' ? 'var(--color-rouge)' : 'var(--color-paper)'}
            stroke="var(--color-rouge)"
            strokeWidth={active === i ? 2.5 : 1.5}
            tabIndex={0}
            aria-label={`${p.period} ${formatCNY(p.amountCNY)} ${p.kind === 'official' ? '官方数据' : '第三方估算'}`}
            className="cursor-pointer outline-none transition-[r]"
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
          />
        ))}
      </svg>

      <figcaption className="mt-3 min-h-12 text-sm leading-relaxed text-ink-soft">
        <span className="font-display text-base text-ink">{point.period}</span>
        <span className="mx-2 text-mist">·</span>
        {formatCNY(point.amountCNY)}
        <span className="mx-2 text-mist">·</span>
        {point.kind === 'official' ? '官方数据' : '第三方估算'}
        <span className="mx-2 text-mist">·</span>
        <a
          href={point.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-ink/20 underline-offset-4 hover:text-rouge"
        >
          {point.sourceTitle}
        </a>
        {hasEstimate && <span className="mt-1 block text-xs text-mist">虚线与空心点为第三方估算，仅供参考。</span>}
      </figcaption>
    </figure>
  );
}
