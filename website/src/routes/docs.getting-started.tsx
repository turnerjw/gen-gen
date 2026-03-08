import {createFileRoute} from "@tanstack/react-router";

export const Route = createFileRoute("/docs/getting-started")({
  component: DocsGettingStartedPage,
});

function DocsGettingStartedPage() {
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold">Getting Started</h2>
      <pre className="overflow-auto rounded-md bg-muted p-3 text-sm">npm install -D gen-gen typescript @faker-js/faker</pre>
      <p className="text-muted-foreground">Replace this page with full onboarding docs.</p>
    </div>
  );
}
