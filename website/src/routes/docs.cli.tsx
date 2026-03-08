import {createFileRoute} from "@tanstack/react-router";

export const Route = createFileRoute("/docs/cli")({
  component: DocsCliPage,
});

function DocsCliPage() {
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">CLI</h2>
      <pre className="overflow-auto rounded-md bg-muted p-3 text-sm">gen-gen --input data-gen.ts</pre>
      <p className="text-muted-foreground">Replace with full CLI flag reference.</p>
    </div>
  );
}
