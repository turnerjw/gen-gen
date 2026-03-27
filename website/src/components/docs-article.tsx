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
    <article className="space-y-6">
      <header className="space-y-3 border-b-brand border-foreground pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-display text-2xl uppercase md:text-3xl">{title}</h1>
          {current ? (
            <a
              href={getEditUrl(current.sourcePath)}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] uppercase tracking-nav text-muted-foreground hover:text-foreground"
            >
              Edit on GitHub
            </a>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">{summary}</p>
      </header>

      <div className="[&_pre]:max-w-full [&_pre]:w-full [&_pre]:overflow-x-auto [&_pre]:overflow-y-hidden min-w-0 space-y-8 text-sm leading-6">
        {children}
      </div>

      {(previous || next) && (
        <footer className="grid gap-0 border-t-brand border-foreground pt-4 sm:grid-cols-2">
          <div>
            {previous ? (
              <Link to={previous.to} className="block border-brand border-foreground p-3 transition-colors hover:bg-foreground hover:text-background">
                <p className="text-[10px] uppercase tracking-nav text-muted-foreground">Previous</p>
                <p className="font-bold">{previous.title}</p>
              </Link>
            ) : null}
          </div>
          <div>
            {next ? (
              <Link to={next.to} className="block border-brand border-l-0 border-foreground p-3 text-right transition-colors hover:bg-foreground hover:text-background max-sm:border-l-[3px] max-sm:border-t-0">
                <p className="text-[10px] uppercase tracking-nav text-muted-foreground">Next</p>
                <p className="font-bold">{next.title}</p>
              </Link>
            ) : null}
          </div>
        </footer>
      )}
    </article>
  );
}
