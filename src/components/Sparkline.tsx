import { scaleLinear } from 'd3-scale';
import { curveMonotoneX, line } from 'd3-shape';
import type { RevenuePoint } from '../lib/types';

const W = 240;
const H = 36;

export default function Sparkline({ series }: { series: RevenuePoint[] }) {
  if (series.length < 2) return null;
  const x = scaleLinear().domain([series[0].x, series[series.length - 1].x]).range([2, W - 2]);
  const y = scaleLinear().domain([0, Math.max(...series.map((p) => p.amountCNY))]).range([H - 2, 2]);
  const d = line<RevenuePoint>()
    .x((p) => x(p.x))
    .y((p) => y(p.amountCNY))
    .curve(curveMonotoneX)(series);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-9 w-full" aria-hidden="true">
      <path d={d ?? ''} fill="none" stroke="currentColor" strokeWidth={1.25} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
