import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

interface MarkdownTextProps {
  children: string;
  className?: string;
}

/**
 * Rendered markdown reading view (GFM: tables, task lists, strikethrough).
 * remark-breaks preserves single newlines as line breaks — notes-app
 * convention (Obsidian/Notion) rather than strict CommonMark soft-breaks.
 * react-markdown renders to React elements — no raw HTML injection.
 */
const MarkdownText = ({ children, className }: MarkdownTextProps) => (
  <div className={['memex-markdown', className ?? ''].filter(Boolean).join(' ')}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      components={{
        a: ({ children: linkChildren, href }) => (
          <a href={href} target="_blank" rel="noreferrer noopener">
            {linkChildren}
          </a>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  </div>
);

export default MarkdownText;
