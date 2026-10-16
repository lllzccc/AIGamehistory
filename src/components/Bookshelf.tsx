import { useCallback, useEffect, useRef, useState } from 'react';
import { withBase } from '../lib/paths';
import { chronicleArtwork, type ChronicleId } from '../lib/chronicles';
import './Bookshelf.css';

interface Book {
  id: ChronicleId; title: string; shortTitle: string; edition: string;
  subtitle: string; description: string; color: string; accent: string;
  companies: number; products: number; firstYear: number | null;
}
export default function Bookshelf({ books }: { books: Book[] }) {
  // Reserve room before rotating; return to the spine before releasing it.
  const [selection, setSelection] = useState<{ id: ChronicleId; phase: 'opening' | 'front' | 'closing' | 'settling' } | null>(null);
  const [immediate, setImmediate] = useState(false);
  const pending = useRef<ChronicleId | null>(null);
  const shelf = useRef<HTMLDivElement>(null);
  const active = selection?.id;
  const selectBook = useCallback((id: ChronicleId | null, keyboard = false) => {
    const instant = keyboard || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setImmediate(instant);
    pending.current = id;
    setSelection(current => {
      if (instant) return id ? { id, phase: 'front' } : null;
      if (!current) return id ? { id, phase: 'opening' } : null;
      if (current.phase === 'closing' || current.phase === 'settling') return current;
      return { ...current, phase: 'closing' };
    });
  }, []);
  useEffect(() => {
    if (!selection || selection.phase === 'front') return;
    const delay = selection.phase === 'closing' ? 320 : 240;
    const timer = window.setTimeout(() => {
      setSelection(current => {
        if (!current) return null;
        if (current.phase === 'opening') return { ...current, phase: 'front' };
        if (current.phase === 'closing') return { ...current, phase: 'settling' };
        return pending.current ? { id: pending.current, phase: 'opening' } : null;
      });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [selection]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      selectBook(null, true);
      if (active) requestAnimationFrame(() => shelf.current?.querySelector<HTMLButtonElement>('[data-book="' + active + '"] .book-select')?.focus());
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [active, selectBook]);
  useEffect(() => {
    if (!active || !window.matchMedia('(max-width: 640px)').matches) return;
    const scroll = () => {
      const container = shelf.current;
      const element = container?.querySelector<HTMLElement>('.is-selected');
      if (element && container) container.scrollTo({ left: container.scrollLeft + element.getBoundingClientRect().left - container.getBoundingClientRect().left - 5, behavior: 'instant' });
    };
    scroll();
    const timer = window.setTimeout(scroll, 250);
    return () => window.clearTimeout(timer);
  }, [active, selection?.phase]);
  return <div className={'archive-shelf' + (immediate ? ' motion-instant' : '')}>
    <div className="shelf-light" aria-hidden="true" />
    <div className="shelf-books" ref={shelf}>
      {books.map(book => {
        const selected = active === book.id;
        const open = selected && selection?.phase === 'front';
        const expanded = selected && selection?.phase !== 'settling';
        return <article key={book.id} data-book={book.id} data-phase={selected ? selection?.phase : 'shelved'}
          className={['archive-book', selected && 'is-selected', expanded && 'is-expanded', open && 'is-open'].filter(Boolean).join(' ')}
          style={{ '--binding': book.color, '--foil': book.accent } as React.CSSProperties}>
          {!selected && <button type="button" className="book-select" aria-label={'展开' + book.title} aria-expanded={false} aria-controls={'volume-' + book.id} onClick={e => selectBook(book.id, e.detail === 0)} />}
          <div className="book-motion"><div className="book-solid">
          <div className="book-back" aria-hidden="true" />
          <div className="book-pages book-pages-top" aria-hidden="true" />
          <div className="book-pages book-pages-bottom" aria-hidden="true" />
          <div className="book-pages book-pages-edge" aria-hidden="true" />
          <div className="book-headband" aria-hidden="true" />
          <div className="book-spine" aria-hidden="true">
            <span className="spine-edition">{book.edition}</span>
            <span className="spine-title">{book.title}</span>
            <span className="spine-date">{book.firstYear ? book.firstYear + ' — 至今' : '首批编目'}</span>
            <span className="spine-mark" aria-hidden="true">✦</span>
          </div>
          <div className="book-cover" id={'volume-' + book.id} inert={!open}>
            <div className="cover-border" aria-hidden="true" />
            <span className="cover-edition"><span>中国游戏公司 · {book.edition}</span><span className="cover-year">{book.firstYear ? book.firstYear + '—至今' : '首批编目'}</span></span>
            <h2>{book.shortTitle}<br />游戏编年史</h2>
            <p className="cover-subtitle">{book.subtitle}</p>
            <div className={'cover-illustration ' + book.id} aria-hidden="true">
              <img src={withBase(chronicleArtwork[book.id])} alt="" />
            </div>
            <p className="cover-description">{book.description}</p>
            <div className="cover-count">{book.companies} 家公司 · {book.products} 款作品</div>
            <a className="cover-read" href={withBase('/chronicle/' + book.id + '/')}>翻开这一卷 <span aria-hidden="true">↗</span></a>
          </div>
          </div></div>
        </article>;
      })}
      <div className="future-volume" aria-label="后续编年史持续扩展"><span>待续</span><small>下一卷</small></div>
    </div>
    <div className="shelf-plank" aria-hidden="true" />
    <div className="shelf-caption" aria-live="polite">
      <span>{selection?.phase === 'front' ? '点击封面入口，开始阅读。' : active ? '向前抽出，再转向封面。' : '鼠标滑过抽出书本，点击查看封面。'}</span>
      {active && <button type="button" onClick={e => selectBook(null, e.detail === 0)}>收起书本 ×</button>}
    </div>
    <noscript><p>选择阅读：{books.map(b => <a key={b.id} href={withBase('/chronicle/' + b.id + '/')}>{b.title}　</a>)}</p></noscript>
  </div>;
}
