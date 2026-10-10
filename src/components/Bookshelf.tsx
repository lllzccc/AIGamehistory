import { useEffect, useRef, useState } from 'react';
import { withBase } from '../lib/paths';
import type { ChronicleId } from '../lib/chronicles';
import './Bookshelf.css';

interface Book {
  id: ChronicleId; title: string; shortTitle: string; edition: string;
  subtitle: string; description: string; color: string; accent: string;
  companies: number; products: number; firstYear: number | null;
}
export default function Bookshelf({ books }: { books: Book[] }) {
  const [active, setActive] = useState<ChronicleId | null>(null);
  const shelf = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!active || !window.matchMedia('(max-width: 640px)').matches) return;
    const element = shelf.current?.querySelector<HTMLElement>('.is-open');
    if (element && shelf.current) shelf.current.scrollTo({ left: element.offsetLeft - shelf.current.offsetLeft - 5, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, [active]);
  return <div className="archive-shelf" onKeyDown={e => { if (e.key === 'Escape') setActive(null); }}>
    <div className="shelf-light" aria-hidden="true" />
    <div className="shelf-books" ref={shelf}>
      {books.map(book => {
        const open = active === book.id;
        return <article key={book.id} className={'archive-book ' + (open ? 'is-open' : '')}
          style={{ '--binding': book.color, '--foil': book.accent } as React.CSSProperties}>
          <div className="book-pages" aria-hidden="true" />
          <button type="button" className="book-spine" aria-expanded={open}
            aria-controls={'volume-' + book.id} aria-label={(open ? '合上' : '展开') + book.title}
            onClick={() => setActive(open ? null : book.id)}>
            <span className="spine-edition">{book.edition}</span>
            <span className="spine-title">{book.title}</span>
            <span className="spine-date">{book.firstYear ? book.firstYear + ' — 至今' : '首批编目'}</span>
            <span className="spine-mark" aria-hidden="true">✦</span>
          </button>
          <div className="book-cover" id={'volume-' + book.id} inert={!open}>
            <div className="cover-border" aria-hidden="true" />
            <span className="cover-edition">中国游戏公司 · {book.edition}</span>
            <h2>{book.shortTitle}<br />游戏编年史</h2>
            <p className="cover-subtitle">{book.subtitle}</p>
            <div className={'cover-illustration ' + book.id} aria-hidden="true">
              {book.id === 'female' ? <img src={withBase('/images/home-ensemble-v2.png')} alt="" /> :
                <><span className="casual-orbit" /><span className="casual-tile one" /><span className="casual-tile two" /><span className="casual-tile three" /></>}
            </div>
            <p className="cover-description">{book.description}</p>
            <div className="cover-count">{book.companies} 家公司 · {book.products} 款作品</div>
            <a className="cover-read" href={withBase('/chronicle/' + book.id + '/')}>翻开这一卷 <span aria-hidden="true">↗</span></a>
          </div>
        </article>;
      })}
      <div className="future-volume" aria-label="后续编年史持续扩展"><span>待续</span><small>下一卷</small></div>
    </div>
    <div className="shelf-plank" aria-hidden="true" />
    <div className="shelf-caption" aria-live="polite">
      <span>{active ? '书已展开，点击封面入口开始阅读。' : '选择一本，轻触书脊。'}</span>
      {active && <button type="button" onClick={() => setActive(null)}>收起书本 ×</button>}
    </div>
    <noscript><p>选择阅读：{books.map(b => <a key={b.id} href={withBase('/chronicle/' + b.id + '/')}>{b.title}　</a>)}</p></noscript>
  </div>;
}
