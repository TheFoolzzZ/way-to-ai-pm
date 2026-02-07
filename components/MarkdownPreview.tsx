"use client";

import type { AnchorHTMLAttributes, HTMLAttributes } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownProps = HTMLAttributes<HTMLElement> & { node?: unknown };
type MarkdownLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { node?: unknown };

const markdownComponents = {
  h1: (props: MarkdownProps) => (
    <h1 {...props} className="text-xl font-semibold text-foreground" />
  ),
  h2: (props: MarkdownProps) => (
    <h2 {...props} className="text-lg font-semibold text-foreground" />
  ),
  h3: (props: MarkdownProps) => (
    <h3 {...props} className="text-base font-semibold text-foreground" />
  ),
  p: (props: MarkdownProps) => (
    <p {...props} className="text-sm leading-relaxed text-secondary" />
  ),
  li: (props: MarkdownProps) => (
    <li {...props} className="text-sm leading-relaxed text-secondary" />
  ),
  a: (props: MarkdownLinkProps) => (
    <a {...props} className="text-primary hover:underline" />
  ),
  code: (props: MarkdownProps) => (
    <code {...props} className="rounded bg-white/10 px-2 py-1 text-xs text-primary" />
  ),
  strong: (props: MarkdownProps) => (
    <strong {...props} className="text-foreground" />
  ),
};

type MarkdownPreviewProps = {
  title?: string;
  content: string;
  highlight?: string;
};

export default function MarkdownPreview({ title, content, highlight }: MarkdownPreviewProps) {
  return (
    <div className="space-y-4">
      {title && (
        <div className="border-b border-white/10 pb-3">
          <h4 className="text-lg font-semibold text-foreground">{title}</h4>
          {highlight && (
            <p className="text-xs uppercase tracking-[0.3em] text-secondary">{highlight}</p>
          )}
        </div>
      )}
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content || "*开始输入内容...*"}
      </ReactMarkdown>
    </div>
  );
}
