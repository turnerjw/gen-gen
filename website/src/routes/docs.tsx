import {Link, Outlet, createFileRoute, useLocation} from "@tanstack/react-router";
import {useMemo, useState} from "react";

import {docsNav} from "@/lib/docs";

export const Route = createFileRoute("/docs")({
  component: DocsLayout,
});

function DocsLayout() {
  const location = useLocation();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return docsNav;
    }

    return docsNav.filter((item) => {
      const haystack = [item.title, item.description, ...item.keywords].join(" ").toLowerCase();
      return haystack.includes(normalized);
    });
  }, [query]);

  return (
    <div className="grid gap-0 md:grid-cols-[260px_1fr]">
      <aside className="min-h-[calc(100vh-var(--header-height))] space-y-3 border-b-brand border-r-0 border-foreground bg-foreground p-4 text-sm text-background md:sticky md:top-[var(--header-height)] md:h-fit md:border-b-0 md:border-r-brand">
        <div>
          <div className="font-display text-lg uppercase tracking-display">Documentation</div>
          <p className="mt-1 text-[10px] uppercase tracking-nav text-syntax-muted">CLI, API, plugin, and behavior reference.</p>
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter docs"
          className="w-full border-brand border-syntax-border bg-syntax-surface px-2 py-1.5 text-sm text-background outline-none placeholder:text-[#555] focus:border-primary"
        />

        <nav className="flex max-h-[60vh] flex-col gap-0.5 overflow-auto pr-1">
          {filtered.map((item) => {
            const active =
              location.pathname === item.to ||
              (item.to === "/docs" && (location.pathname === "/docs" || location.pathname === "/docs/"));

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`px-2 py-1.5 text-xs transition-colors ${
                  active
                    ? "bg-primary font-bold text-foreground"
                    : "text-[#666] hover:bg-syntax-surface hover:text-background"
                }`}
              >
                {item.title}
              </Link>
            );
          })}
          {filtered.length === 0 ? <p className="px-2 py-1 text-[10px] text-syntax-muted">No matching docs.</p> : null}
        </nav>
      </aside>

      <section className="min-w-0 p-8 md:p-12">
        <Outlet />
      </section>
    </div>
  );
}
