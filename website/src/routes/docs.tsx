import {Link, Outlet, createFileRoute, useLocation} from "@tanstack/react-router";
import {useCallback, useMemo, useState} from "react";

import {DocsSearch, DocsSearchTrigger} from "@/components/docs-search";
import {TableOfContents} from "@/components/table-of-contents";
import {docsNav, docsSections} from "@/lib/docs";
import {getHeadingsForRoute} from "@/lib/docs-content";

export const Route = createFileRoute("/docs")({
  component: DocsLayout,
});

function DocsLayout() {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  const groupedBySection = useMemo(() => {
    const groups: {section: string; items: typeof docsNav}[] = [];
    for (const section of docsSections) {
      const items = docsNav.filter((item) => item.section === section);
      if (items.length > 0) {
        groups.push({section, items});
      }
    }
    return groups;
  }, []);

  const headings = useMemo(() => getHeadingsForRoute(location.pathname), [location.pathname]);

  const handleOpenChange = useCallback((open: boolean) => {
    setSearchOpen(open);
  }, []);

  return (
    <div className="grid min-h-[calc(100vh-var(--header-height))] gap-0 bg-docs-surface md:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_200px]">
      {/* Sidebar */}
      <aside className="space-y-3 border-b-brand border-r-0 border-docs-divider bg-foreground p-4 text-sm text-background md:sticky md:top-[var(--header-height)] md:h-[calc(100vh-var(--header-height))] md:overflow-y-auto md:border-b-0 md:border-r-brand md:border-r-docs-divider">
        <div>
          <div className="font-display text-lg uppercase tracking-display">Documentation</div>
          {/* <p className="mt-1 text-xs uppercase tracking-nav text-syntax-muted">CLI, API, plugin, and behavior reference.</p> */}
        </div>

        <DocsSearchTrigger onClick={() => setSearchOpen(true)} />

        <nav className="flex flex-col gap-0.5 pr-1">
          {groupedBySection.map((group) => (
            <div key={group.section} className="mt-3 first:mt-0">
              <div className="mx-2 mb-1 border-b border-syntax-muted pb-1 text-xs font-semibold uppercase tracking-nav text-syntax-muted">{group.section}</div>
              {group.items.map((item) => {
                const active =
                  location.pathname === item.to ||
                  (item.to === "/docs" && (location.pathname === "/docs" || location.pathname === "/docs/"));

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`block px-2 py-1.5 text-sm transition-colors ${
                      active
                        ? "bg-primary font-bold text-foreground"
                        : "text-docs-muted hover:bg-syntax-surface hover:text-background"
                    }`}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <section className="min-w-0 px-8 py-10 md:px-16 md:py-14">
        <div className="mx-auto max-w-3xl">
          <Outlet />
        </div>
      </section>

      {/* Table of contents */}
      <aside className="hidden p-4 pt-14 xl:sticky xl:top-[var(--header-height)] xl:block xl:h-[calc(100vh-var(--header-height))] xl:overflow-y-auto">
        <TableOfContents headings={headings} />
      </aside>

      {/* Command palette */}
      <DocsSearch open={searchOpen} onOpenChange={handleOpenChange} />
    </div>
  );
}
