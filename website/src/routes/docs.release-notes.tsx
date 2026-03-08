import {createFileRoute} from "@tanstack/react-router";

import {DocsArticle} from "@/components/docs-article";

export const Route = createFileRoute("/docs/release-notes")({
  component: DocsReleaseNotesPage,
});

function DocsReleaseNotesPage() {
  return (
    <DocsArticle
      title="Release Notes"
      summary="Track documentation and feature updates; use this page as the public changelog entry point for docs consumers."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">0.1.0 (MVP docs baseline)</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Added full docs IA for CLI, API, plugin, presets, advanced behavior, and troubleshooting.</li>
          <li>Added examples page aligned with repository `example/*` folders.</li>
          <li>Added playground guidance and docs QA checklist.</li>
          <li>Added docs sidebar filter, next/previous navigation, and Edit on GitHub links.</li>
        </ul>
      </section>
    </DocsArticle>
  );
}
