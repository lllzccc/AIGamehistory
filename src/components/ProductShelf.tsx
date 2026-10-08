import { useCallback, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import type { ProductCard } from '../lib/types';
import { yearOf } from '../lib/dates';
import { genreLabel } from '../lib/labels';
import ProductDrawer from './ProductDrawer';
import Sparkline from './Sparkline';

export default function ProductShelf({ products }: { products: ProductCard[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const close = useCallback(() => setOpenId(null), []);
  const open = products.find((p) => p.id === openId);

  return (
    <MotionConfig reducedMotion="user">
      <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p, i) => {
          const art = p.keyArt ?? p.cover;
          return (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <button type="button" onClick={() => setOpenId(p.id)} className="group block w-full text-left">
                <div className="relative aspect-[4/5] overflow-hidden bg-paper-deep">
                  {art ? (
                    <img
                      src={art}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-display text-7xl text-ink/10">
                      {yearOf(p.released)}
                    </div>
                  )}
                  <span className="absolute top-4 left-4 bg-paper/90 px-2 py-1 text-xs tracking-widest text-ink-soft">
                    {genreLabel[p.genre]}
                  </span>
                  {p.status === 'shutdown' && (
                    <span className="absolute top-4 right-4 bg-ink/80 px-2 py-1 text-xs tracking-widest text-paper">
                      已停服
                    </span>
                  )}
                </div>
                <div className="mt-5 flex items-baseline justify-between gap-4">
                  <h3 className="font-serif text-xl text-ink transition group-hover:text-rouge">{p.name}</h3>
                  <span className="font-display text-lg text-mist">{yearOf(p.released)}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">{p.significance}</p>
                {p.series.length >= 2 && (
                  <div className="mt-4 text-rouge/80">
                    <Sparkline series={p.series} />
                  </div>
                )}
              </button>
            </motion.li>
          );
        })}
      </ul>

      <AnimatePresence>{open && <ProductDrawer key={open.id} product={open} onClose={close} />}</AnimatePresence>
    </MotionConfig>
  );
}
