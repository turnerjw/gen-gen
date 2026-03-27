import type {PropsWithChildren} from "react";
import {Link, useLocation} from "@tanstack/react-router";

import {getAdjacentDocs, getCurrentDoc, getEditUrl} from "@/lib/docs";

interface DocsArticleProps extends PropsWithChildren {
  title: string;
  summary: string;
}

export function DocsArticle({title, summary, children}: DocsArticleProps) {
  const location = useLocation();
  const current = getCurrentDoc(location.pathname);
  const {previous, next} = getAdjacentDocs(location.pathname);

  return (
    <article className="space-y-8">
      <header className="space-y-3 border-b-brand border-docs-divider pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-display text-3xl uppercase text-docs-heading md:text-4xl">{title}</h1>
          {current ? (
            <a
              href={getEditUrl(current.sourcePath)}
              target="_blank"
              rel="noreferrer"
              className="text-xs uppercase tracking-nav text-docs-muted transition-colors hover:text-docs-link"
            >
              Edit on GitHub
            </a>
          ) : null}
        </div>
        <p className="text-sm text-docs-muted">{summary}</p>
      </header>

      <div className="docs-prose min-w-0 space-y-8 text-base leading-[1.8] text-docs-text [&_pre]:w-full [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:overflow-y-hidden">
        {children}
      </div>

      {(previous || next) && (
        <footer className="pt-6">
          <div className="grid gap-[3px] rounded-lg sm:grid-cols-2">
            {previous ? (
              <Link
                to={previous.to}
                className="docs-nav-card rounded-tl-lg p-5 transition-all max-sm:rounded-tr-lg sm:rounded-bl-lg"
              >
                <p className="text-xs uppercase tracking-nav text-docs-muted">Previous</p>
                <p className="font-bold text-docs-heading">{previous.title}</p>
              </Link>
            ) : <div className="rounded-tl-lg bg-docs-surface max-sm:rounded-tr-lg sm:rounded-bl-lg" />}
            {next ? (
              <Link
                to={next.to}
                className="docs-nav-card rounded-tr-lg p-5 text-right transition-all max-sm:rounded-bl-lg max-sm:rounded-tr-none sm:rounded-br-lg"
              >
                <p className="text-xs uppercase tracking-nav text-docs-muted">Next</p>
                <p className="font-bold text-docs-heading">{next.title}</p>
              </Link>
            ) : <div className="rounded-tr-lg bg-docs-surface max-sm:rounded-bl-lg max-sm:rounded-tr-none sm:rounded-br-lg" />}
          </div>
        </footer>
      )}
    </article>
  );
}
