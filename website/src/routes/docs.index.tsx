import {createFileRoute, Link} from "@tanstack/react-router";

import {DocsArticle} from "@/components/docs-article";

export const Route = createFileRoute("/docs/")({
  component: DocsIndexPage,
});

function DocsIndexPage() {
  return (
    <DocsArticle
      title="Docs Overview"
      summary="This docs section is implemented as file-based React route components under website/src/routes with a shared docs shell."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Information Architecture</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Getting Started</li>
          <li>CLI Reference</li>
          <li>API Reference</li>
          <li>Vite Plugin Reference</li>
          <li>Faker Overrides and Strategies</li>
          <li>Presets</li>
          <li>Advanced Behavior</li>
          <li>Examples</li>
          <li>Troubleshooting</li>
          <li>Playground</li>
          <li>Release Notes</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Approach</h2>
        <p>
          Content is authored directly in route components to keep docs colocated with routing and reusable UI. This keeps
          MVP docs static, versioned in git, and easy to verify during CI builds.
        </p>
        <p>
          Use the sidebar filter to quickly locate pages, and use each page footer for next/previous navigation.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Start Here</h2>
        <p>
          New users should begin with <Link to="/docs/getting-started" className="underline">Getting Started</Link>, then read the <Link to="/docs/cli" className="underline">CLI Reference</Link>.
        </p>
      </section>
    </DocsArticle>
  );
}
