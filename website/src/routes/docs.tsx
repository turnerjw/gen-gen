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
      <aside className="h-fit space-y-3 border-b-[3px] border-r-0 border-foreground p-4 text-sm md:sticky md:top-[52px] md:border-b-0 md:border-r-[3px]">
        <div>
          <div className="font-display text-sm uppercase">Documentation</div>
          <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">CLI, API, plugin, and behavior reference.</p>
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter docs"
          className="w-full border-2 border-foreground bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
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
                    ? "bg-foreground font-bold text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.title}
              </Link>
            );
          })}
          {filtered.length === 0 ? <p className="px-2 py-1 text-[10px] text-muted-foreground">No matching docs.</p> : null}
        </nav>
      </aside>

      <section className="min-w-0 p-6 md:p-8">
        <Outlet />
      </section>
    </div>
  );
}
