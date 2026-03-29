import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {Language} from "prism-react-renderer";
import {Link} from "@tanstack/react-router";

import {DocsArticle} from "@/components/docs-article";
import {CodeBlock} from "@/components/code-block";
import {slugify} from "@/lib/docs-content";

interface Frontmatter {
  title: string;
  summary: string;
  keywords: string[];
}

function parseFrontmatter(raw: string): {frontmatter: Frontmatter; body: string} {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return {frontmatter: {title: "", summary: "", keywords: []}, body: raw};
  }

  const yamlBlock = match[1];
  const body = match[2];

  const title = yamlBlock.match(/^title:\s*(.+)$/m)?.[1]?.trim() ?? "";
  const summary = yamlBlock.match(/^summary:\s*(.+)$/m)?.[1]?.trim() ?? "";
  const keywordsMatch = yamlBlock.match(/^keywords:\s*\[([^\]]*)\]/m);
  const keywords = keywordsMatch
    ? keywordsMatch[1].split(",").map((k) => k.trim().replace(/^['"]|['"]$/g, ""))
    : [];

  return {frontmatter: {title, summary, keywords}, body};
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (!node) return "";
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && "props" in node) {
    return extractText((node as React.ReactElement<{children?: React.ReactNode}>).props.children);
  }
  return "";
}

interface MarkdownDocProps {
  raw: string;
}

export function MarkdownDoc({raw}: MarkdownDocProps) {
  const {frontmatter, body} = parseFrontmatter(raw);

  return (
    <DocsArticle title={frontmatter.title} summary={frontmatter.summary}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || "");
            if (match) {
              return (
                <CodeBlock
                  language={match[1] as Language}
                  code={String(children).replace(/\n$/, "")}
                />
              );
            }
            return (
              <code
                className="rounded bg-muted px-1 py-0.5 text-[0.875em] font-mono text-foreground"
                {...props}
              >
                {children}
              </code>
            );
          },
          a({href, children}) {
            if (href?.startsWith("/")) {
              return (
                <Link to={href} className="underline hover:text-primary">
                  {children}
                </Link>
              );
            }
            return (
              <a href={href} target="_blank" rel="noreferrer" className="underline hover:text-primary">
                {children}
              </a>
            );
          },
          h2({children}) {
            const text = typeof children === "string" ? children : extractText(children);
            const id = slugify(text);
            return <h2 id={id} className="text-xl font-semibold scroll-mt-[calc(var(--header-height)+2rem)]">{children}</h2>;
          },
          h3({children}) {
            const text = typeof children === "string" ? children : extractText(children);
            const id = slugify(text);
            return <h3 id={id} className="text-base font-semibold scroll-mt-[calc(var(--header-height)+2rem)]">{children}</h3>;
          },
          ul({children}) {
            return <ul className="list-disc space-y-1 pl-5">{children}</ul>;
          },
          ol({children}) {
            return <ol className="list-decimal space-y-1 pl-5">{children}</ol>;
          },
          p({children}) {
            return <p>{children}</p>;
          },
          table({children}) {
            return (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">{children}</table>
              </div>
            );
          },
          thead({children}) {
            return <thead className="border-b border-docs-divider">{children}</thead>;
          },
          tr({children}) {
            return <tr className="border-b border-docs-divider">{children}</tr>;
          },
          th({children}) {
            return (
              <th className="px-3 py-2 text-left font-semibold text-docs-heading">{children}</th>
            );
          },
          td({children}) {
            return <td className="px-3 py-2">{children}</td>;
          },
        }}
      >
        {body}
      </ReactMarkdown>
    </DocsArticle>
  );
}
