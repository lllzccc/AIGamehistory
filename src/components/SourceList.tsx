import type { Source } from '../lib/types';

export default function SourceList({ sources }: { sources: Source[] }) {
  return (
    <div className="border-t border-ink/10 pt-6">
      <h3 className="text-xs tracking-[0.3em] text-mist">来源</h3>
      <ol className="mt-3 space-y-1.5 text-sm">
        {sources.map((source, i) => (
          <li key={i} className="flex gap-3">
            <span className="font-display text-mist">{i + 1}</span>
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="text-ink-soft underline decoration-ink/20 underline-offset-4 transition hover:text-rouge"
            >
              {source.title}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
