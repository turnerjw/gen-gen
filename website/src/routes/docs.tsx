import {Link, Outlet, createFileRoute} from "@tanstack/react-router";

export const Route = createFileRoute("/docs")({
  component: DocsLayout,
});

function DocsLayout() {
  return (
    <div className="grid gap-6 md:grid-cols-[240px_1fr]">
      <aside className="space-y-2 rounded-lg border p-3 text-sm">
        <div className="font-medium">Documentation</div>
        <nav className="flex flex-col gap-1">
          <Link to="/docs" className="text-muted-foreground hover:text-foreground">
            Overview
          </Link>
          <Link to="/docs/getting-started" className="text-muted-foreground hover:text-foreground">
            Getting Started
          </Link>
          <Link to="/docs/cli" className="text-muted-foreground hover:text-foreground">
            CLI
          </Link>
        </nav>
      </aside>
      <section className="rounded-lg border p-5">
        <Outlet />
      </section>
    </div>
  );
}
