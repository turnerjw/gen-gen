import {Command} from "cmdk";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";

import {useNavigate} from "@tanstack/react-router";

import {type SearchableDoc, searchableDocs} from "@/lib/docs-content";
import {cn} from "@/lib/utils";

interface SearchResult {
  doc: SearchableDoc;
  snippet: string;
  matchStart: number;
}

function getSnippet(body: string, query: string, contextLen = 90): {snippet: string; matchStart: number} | null {
  const lower = body.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return null;

  const start = Math.max(0, idx - Math.floor(contextLen / 2));
  const end = Math.min(body.length, idx + query.length + Math.floor(contextLen / 2));

  let snippet = body.slice(start, end);
  if (start > 0) snippet = `...${snippet}`;
  if (end < body.length) snippet = `${snippet}...`;

  return {snippet, matchStart: idx - start + (start > 0 ? 3 : 0)};
}

function HighlightedSnippet({snippet, query}: {snippet: string; query: string}) {
  if (!query) return <span>{snippet}</span>;

  const parts: {text: string; highlight: boolean}[] = [];
  const lower = snippet.toLowerCase();
  const qLower = query.toLowerCase();
  let cursor = 0;

  while (cursor < snippet.length) {
    const idx = lower.indexOf(qLower, cursor);
    if (idx === -1) {
      parts.push({text: snippet.slice(cursor), highlight: false});
      break;
    }
    if (idx > cursor) {
      parts.push({text: snippet.slice(cursor, idx), highlight: false});
    }
    parts.push({text: snippet.slice(idx, idx + query.length), highlight: true});
    cursor = idx + query.length;
  }

  return (
    <span>
      {parts.map((part, i) =>
        part.highlight ? (
          <span key={i} className="font-bold text-primary">
            {part.text}
          </span>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </span>
  );
}

export function DocsSearchTrigger({onClick}: {onClick: () => void}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between border-brand border-syntax-border bg-syntax-surface px-2 py-1.5 text-sm text-[#555] transition-colors hover:border-primary hover:text-docs-muted"
    >
      <span>Search docs...</span>
      <kbd className="rounded border border-syntax-border bg-foreground px-1.5 py-0.5 font-mono text-xs text-syntax-muted">
        ⌘K
      </kbd>
    </button>
  );
}

export function DocsSearch({open, onOpenChange}: {open: boolean; onOpenChange: (open: boolean) => void}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setQuery("");
      // cmdk handles focus internally, but schedule a fallback
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  // Global keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const results = useMemo<SearchResult[]>(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    const matches: SearchResult[] = [];

    for (const doc of searchableDocs) {
      // Check title, description, keywords first
      const metaHaystack = [doc.nav.title, doc.nav.description, ...doc.nav.keywords].join(" ");
      const metaMatch = metaHaystack.toLowerCase().includes(normalized);

      // Check body content
      const bodySnippet = getSnippet(doc.body, normalized);

      if (bodySnippet) {
        matches.push({doc, snippet: bodySnippet.snippet, matchStart: bodySnippet.matchStart});
      } else if (metaMatch) {
        // Use description as snippet when match is in metadata only
        matches.push({doc, snippet: doc.nav.description, matchStart: -1});
      }
    }

    return matches;
  }, [query]);

  const handleSelect = useCallback(
    (to: string) => {
      onOpenChange(false);
      navigate({to}).then(() => {
        window.scrollTo(0, 0);
      });
    },
    [navigate, onOpenChange],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={() => onOpenChange(false)} onKeyDown={() => {}} />

      {/* Dialog */}
      <Command
        className="relative z-10 w-full max-w-lg overflow-hidden rounded border-brand border-syntax-border bg-foreground shadow-2xl"
        shouldFilter={false}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Escape") {
            onOpenChange(false);
          }
        }}
      >
        <Command.Input
          ref={inputRef}
          value={query}
          onValueChange={setQuery}
          placeholder="Search documentation..."
          className="w-full border-b border-syntax-border bg-foreground px-4 py-3 text-sm text-background outline-none placeholder:text-[#555]"
        />

        <Command.List className="max-h-[300px] overflow-y-auto p-2">
          {query.trim() === "" && (
            <Command.Empty className="px-4 py-6 text-center text-sm text-syntax-muted">
              Type to search across all documentation...
            </Command.Empty>
          )}

          {query.trim() !== "" && results.length === 0 && (
            <Command.Empty className="px-4 py-6 text-center text-sm text-syntax-muted">
              No results found.
            </Command.Empty>
          )}

          {results.map((result) => (
            <Command.Item
              key={result.doc.nav.to}
              value={result.doc.nav.to}
              onSelect={() => handleSelect(result.doc.nav.to)}
              className={cn(
                "cursor-pointer rounded px-3 py-2 text-sm",
                "aria-selected:bg-syntax-surface",
              )}
            >
              <div className="font-semibold text-background">{result.doc.nav.title}</div>
              <div className="mt-0.5 text-xs text-docs-muted">
                <HighlightedSnippet snippet={result.snippet} query={query.trim()} />
              </div>
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </div>
  );
}
