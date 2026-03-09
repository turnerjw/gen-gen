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
    <div className="grid gap-6 md:grid-cols-[280px_1fr]">
      <aside className="h-fit space-y-3 rounded-lg border bg-card p-3 text-sm md:sticky md:top-6">
        <div>
          <div className="font-medium">Documentation</div>
          <p className="text-xs text-muted-foreground">MVP reference for CLI, API, plugin, and behavior details.</p>
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter docs"
          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm outline-none ring-primary focus:ring-1"
        />

        <nav className="flex max-h-[60vh] flex-col gap-1 overflow-auto pr-1">
          {filtered.map((item) => {
            const active =
              location.pathname === item.to ||
              (item.to === "/docs" && (location.pathname === "/docs" || location.pathname === "/docs/"));

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded px-2 py-1.5 ${
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                {item.title}
              </Link>
            );
          })}
          {filtered.length === 0 ? <p className="px-2 py-1 text-xs text-muted-foreground">No matching docs pages.</p> : null}
        </nav>
      </aside>

      <section className="min-w-0 rounded-lg border bg-card p-5">
        <Outlet />
      </section>
    </div>
  );
}
