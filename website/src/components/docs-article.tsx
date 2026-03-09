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
      <header className="space-y-3 border-b pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {current ? (
            <a
              href={getEditUrl(current.sourcePath)}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Edit on GitHub
            </a>
          ) : null}
        </div>
        <p className="text-muted-foreground">{summary}</p>
      </header>

      <div className="[&_pre]:max-w-full [&_pre]:w-full [&_pre]:overflow-x-auto [&_pre]:overflow-y-hidden min-w-0 space-y-6 text-sm leading-6">
        {children}
      </div>

      {(previous || next) && (
        <footer className="grid gap-3 border-t pt-4 sm:grid-cols-2">
          <div>
            {previous ? (
              <Link to={previous.to} className="block rounded-md border bg-card p-3 hover:bg-muted/60">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Previous</p>
                <p className="font-medium">{previous.title}</p>
              </Link>
            ) : null}
          </div>
          <div>
            {next ? (
              <Link to={next.to} className="block rounded-md border bg-card p-3 text-right hover:bg-muted/60">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Next</p>
                <p className="font-medium">{next.title}</p>
              </Link>
            ) : null}
          </div>
        </footer>
      )}
    </article>
  );
}
