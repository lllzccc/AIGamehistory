import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import type { ProductCard } from '../lib/types';
import { formatDate } from '../lib/dates';
import { genreLabel, productStatusLabel } from '../lib/labels';
import RevenueChart from './RevenueChart';
import SourceList from './SourceList';

interface Props {
  product: ProductCard;
  onClose: () => void;
}

const ease = [0.22, 1, 0.36, 1] as const;
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function ProductDrawer({ product, onClose }: Props) {
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement | SVGElement>(FOCUSABLE));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const current = document.activeElement;
      const inside = current instanceof Node && panelRef.current.contains(current);
      if (e.shiftKey && (current === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (current === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
      previousFocus?.focus({ preventScroll: true });
    };
  }, [onClose]);

  const art = product.keyArt ?? product.cover;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={product.name}>
      <motion.div
        className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />
      <motion.aside
        ref={panelRef}
        className="absolute inset-y-0 right-0 w-[min(600px,94vw)] overflow-y-auto bg-paper shadow-2xl"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.45, ease }}
      >
        {art && <img src={art} alt="" className="aspect-[16/9] w-full object-cover object-top" />}
        <div className="px-8 pt-8 pb-16 sm:px-10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs tracking-[0.3em] text-mist">{genreLabel[product.genre]}</p>
              <h2 className="mt-2 font-serif text-3xl text-ink">{product.name}</h2>
              {product.aliases.length > 0 && <p className="mt-1 text-sm text-mist">{product.aliases.join(' / ')}</p>}
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="关闭"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/15 text-xl text-ink-soft transition hover:border-rouge hover:text-rouge"
            >
              ×
            </button>
          </div>
          {!product.verified && <span className="unverified mt-4">待核实</span>}

          <p className="mt-6 font-serif text-lg leading-relaxed text-ink-soft">{product.significance}</p>

          <dl className="mt-8 grid grid-cols-[5rem_1fr] gap-y-3 border-t border-ink/10 pt-6 text-sm">
            <dt className="text-mist">研发</dt>
            <dd className="text-ink">{product.developerName}</dd>
            <dt className="text-mist">发行</dt>
            <dd className="text-ink">{product.publisherName}</dd>
            <dt className="text-mist">首发</dt>
            <dd className="text-ink">{formatDate(product.released)}</dd>
            {product.shutdown && (
              <>
                <dt className="text-mist">停服</dt>
                <dd className="text-ink">{formatDate(product.shutdown)}</dd>
              </>
            )}
            <dt className="text-mist">平台</dt>
            <dd className="text-ink">{product.platforms.join('、')}</dd>
            <dt className="text-mist">状态</dt>
            <dd className="text-ink">{productStatusLabel[product.status]}</dd>
          </dl>

          <section className="mt-10">
            <h3 className="font-serif text-lg text-ink">营收流水</h3>
            {product.series.length > 0 ? (
              <RevenueChart series={product.series} />
            ) : (
              <p className="mt-3 text-sm text-mist">暂无可靠的流水数据。</p>
            )}
          </section>

          <div className="mt-10">
            <SourceList sources={product.sources} />
          </div>
        </div>
      </motion.aside>
    </div>
  );
}
