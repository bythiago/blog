import { defaultSchema, type Schema } from 'hast-util-sanitize';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

/**
 * O schema padrão do rehype-sanitize remove classes; aqui liberamos apenas as
 * classes de linguagem (`language-*`) e de tokens do highlight.js (`hljs-*`).
 */
const sanitizeSchema: Schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a ?? []), 'target', 'rel'],
    code: [['className', /^language-[\w-]+$/]],
    span: [['className', /^hljs[\w.-]*$/]],
  },
};

interface MarkdownViewProps {
  content: string;
}

export function MarkdownView({ content }: MarkdownViewProps) {
  return (
    <div className="prose-blog">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [rehypeHighlight, { detect: false }],
          [rehypeSanitize, sanitizeSchema],
        ]}
        components={{
          a({ href, children, node }) {
            void node;
            const external = typeof href === 'string' && /^https?:\/\//.test(href);
            return (
              <a
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
              >
                {children}
              </a>
            );
          },
          code({ className, children, node, ...props }) {
            void node;
            const language = /language-([\w-]+)/.exec(className ?? '')?.[1];
            const text = String(children);
            const isBlock = Boolean(language) || text.includes('\n') || className?.includes('hljs');
            if (!isBlock) {
              return (
                <code
                  className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-zinc-800"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return <CodeBlock className={className}>{children}</CodeBlock>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
