import { useRef, type PointerEvent } from 'react';
import { motion, MotionConfig } from 'motion/react';
import type { TimelineItem, TimelineKind } from '../lib/types';
import { dateToNumber, formatDate } from '../lib/dates';
import { timelineKindLabel } from '../lib/labels';
import { assignLevels } from '../lib/timelineLayout';

const PX_PER_YEAR = 180;
const PAD = 96;
const HEIGHT = 400;
const AXIS_Y = HEIGHT / 2;
const LEVEL_OFFSETS = [-64, 64, -140, 140];
const LABEL_WIDTH = 168;

function dotClass(kind: TimelineKind): string {
  switch (kind) {
    case 'launch':
      return 'h-3.5 w-3.5 bg-rouge ring-4 ring-paper';
    case 'founded':
      return 'h-4 w-4 border-2 border-ink bg-paper';
    case 'shutdown':
      return 'h-3 w-3 bg-mist ring-4 ring-paper';
    default:
      return 'h-2.5 w-2.5 bg-ink ring-4 ring-paper';
  }
}

interface Props {
  items: TimelineItem[];
  endYear: number;
}

export default function CompanyTimeline({ items, endYear }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number } | null>(null);

  if (items.length === 0) return null;

  const startYear = Math.floor(dateToNumber(items[0].date));
  const xs = items.map((item) => PAD + (dateToNumber(item.date) - startYear) * PX_PER_YEAR);
  const levels = assignLevels(xs, LABEL_WIDTH + 16);
  const years = Array.from({ length: endYear - startYear + 2 }, (_, k) => startYear + k);
  const width = PAD * 2 + (years.length - 1) * PX_PER_YEAR;

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !scroller.current) return;
    drag.current = { x: e.clientX, left: scroller.current.scrollLeft };
    scroller.current.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !scroller.current) return;
    scroller.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
  };
  const endDrag = () => {
    drag.current = null;
  };

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={scroller}
        className="timeline-scroller cursor-grab overflow-x-auto select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="relative" style={{ width, height: HEIGHT }}>
          <div className="absolute inset-x-0 h-px bg-ink/20" style={{ top: AXIS_Y }} />

          {years.map((year) => (
            <div
              key={year}
              className="absolute flex -translate-x-1/2 flex-col items-center"
              style={{ left: PAD + (year - startYear) * PX_PER_YEAR, top: AXIS_Y - 6 }}
            >
              <span className="h-3 w-px bg-ink/25" />
              <span className="mt-2 font-display text-sm text-mist">{year}</span>
            </div>
          ))}

          {items.map((item, i) => {
            const offset = LEVEL_OFFSETS[levels[i]];
            const up = offset < 0;
            return (
              <motion.div
                key={`${item.date}-${i}`}
                className="absolute top-0"
                style={{ left: xs[i], height: HEIGHT }}
                initial={{ opacity: 0, y: up ? 10 : -10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
              >
                <span
                  className="absolute w-px bg-ink/15"
                  style={up ? { top: AXIS_Y + offset, height: -offset } : { top: AXIS_Y, height: offset }}
                />
                <span
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${dotClass(item.kind)}`}
                  style={{ top: AXIS_Y }}
                />
                <div
                  className="absolute"
                  style={{
                    width: LABEL_WIDTH,
                    left: -12,
                    ...(up ? { bottom: HEIGHT - (AXIS_Y + offset) + 6 } : { top: AXIS_Y + offset + 6 }),
                  }}
                >
                  <p className="font-display text-xs tracking-wide text-mist">
                    {formatDate(item.date)} · {timelineKindLabel[item.kind]}
                  </p>
                  <p className="mt-1 line-clamp-3 font-serif text-sm leading-snug text-ink" title={item.label}>
                    {item.label}
                  </p>
                  {!item.verified && <span className="unverified mt-1">待核实</span>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </MotionConfig>
  );
}
