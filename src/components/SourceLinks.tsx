import type { Source } from '../lib/types';

export default function SourceLinks({ sources }: { sources: Source[] }) {
  return (
    <>
      {sources.map((source, i) => (
        <a
          key={i}
          href={source.url}
          target="_blank"
          rel="noreferrer"
          title={source.title}
          className="underline decoration-ink/20 underline-offset-2 transition hover:text-rouge"
        >
          来源{sources.length > 1 ? i + 1 : ''}
        </a>
      ))}
    </>
  );
}
