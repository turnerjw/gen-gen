import {Link, createFileRoute} from "@tanstack/react-router";

import {Button} from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <section className="space-y-8">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Type-safe test data generation</p>
        <h1 className="text-4xl font-bold tracking-tight">Generate realistic test factories from TypeScript types</h1>
        <p className="max-w-2xl text-muted-foreground">
          `gen-gen` creates composable data generators with nested helpers, overrides, and strategy support.
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={() => window.open("https://github.com", "_blank")}>GitHub</Button>
        <Button variant="secondary" onClick={() => window.open("https://www.npmjs.com/package/gen-gen", "_blank")}>
          npm
        </Button>
        <Link to="/docs" className="inline-flex">
          <Button variant="ghost">Open Docs</Button>
        </Link>
      </div>
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Docs routes are file-based and scaffolded. Add pages under `website/src/routes`.
      </div>
    </section>
  );
}
