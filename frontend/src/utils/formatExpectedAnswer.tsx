import type { ReactNode } from 'react';

export function normalizeExpectedAnswer(answer: string): string {
  return answer
    .split(/\r?\n/)
    .map((line) => {
      const trimmedLeft = line.replace(/^\s*/, '');
      const bulletMatch = trimmedLeft.match(/^-\s*(.*)$/);
      if (bulletMatch) {
        const value = bulletMatch[1].trim();
        return value ? `- ${value}` : '-';
      }
      return line.replace(/\s+$/, '');
    })
    .join('\n')
    .trim();
}

function isCodeAnswer(answer: string): boolean {
  const trimmed = answer.trim();
  if (/^```[\s\S]*```$/.test(trimmed)) return true;
  const lines = trimmed.split(/\r?\n/);
  return lines.some((line) => /^\s{2,}|^\t/.test(line));
}

export function formatExpectedAnswer(answer: string | null | undefined, fallback: ReactNode = '—'): ReactNode {
  if (!answer?.trim()) {
    return fallback;
  }

  const normalized = normalizeExpectedAnswer(answer);
  if (isCodeAnswer(normalized)) {
    return (
      <pre style={{ margin: '0.3rem 0', padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', overflowX: 'auto', fontSize: '0.9rem', lineHeight: 1.5, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
        {normalized}
      </pre>
    );
  }

  const lines = normalized.split(/\r?\n/);
  const blocks: Array<{ type: 'text' | 'list'; content: string[] }> = [];
  let currentList: string[] | null = null;

  for (const line of lines) {
    const trimmed = line.replace(/^\s*/, '');
    const bulletMatch = trimmed.match(/^-\s*(.*)$/);

    if (bulletMatch) {
      if (currentList === null) {
        currentList = [];
        blocks.push({ type: 'list', content: currentList });
      }
      currentList.push(bulletMatch[1].trim() || '-');
      continue;
    }

    currentList = null;
    blocks.push({ type: 'text', content: [line] });
  }

  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === 'list') {
          return (
            <ul key={index} style={{ margin: '0.4rem 0 0.4rem 1.2rem', paddingLeft: '1rem' }}>
              {block.content.map((item, itemIndex) => (
                <li key={itemIndex} style={{ marginBottom: '0.2rem' }}>
                  {item}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} style={{ margin: '0.3rem 0' }}>
            {block.content.reduce<ReactNode[]>((acc, part, partIndex) => {
              if (partIndex > 0) acc.push(<br key={`br-${partIndex}`} />);
              acc.push(part);
              return acc;
            }, [])}
          </p>
        );
      })}
    </>
  );
}
