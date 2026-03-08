import {createFileRoute} from "@tanstack/react-router";

export const Route = createFileRoute("/docs/")({
  component: DocsIndexPage,
});

function DocsIndexPage() {
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">Docs Overview</h2>
      <p className="text-muted-foreground">
        This scaffold is ready for docs contributors. Add new pages under `website/src/routes` and link them in the docs
        sidebar.
      </p>
    </div>
  );
}
