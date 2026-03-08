import {createFileRoute} from "@tanstack/react-router";

import {DocsArticle} from "@/components/docs-article";

export const Route = createFileRoute("/docs/qa-checklist")({
  component: DocsQaChecklistPage,
});

function DocsQaChecklistPage() {
  return (
    <DocsArticle
      title="Docs QA Checklist"
      summary="Use this checklist before release to keep docs examples valid and aligned with current CLI/API/plugin behavior."
    >
      <section className="space-y-3">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Run `bun run build` in repo root and ensure package compile passes.</li>
          <li>Run `bun run gen:example` and confirm all example generators still compile and generate.</li>
          <li>Run `bun run web:typecheck` and `bun run web:build` to validate website routes and content compile.</li>
          <li>Verify CLI docs flags match `printHelp()` output in `src/cli-core.ts`.</li>
          <li>Verify API docs option names match `GenerateOptions` and `GenerateResult` in `src/generator.ts`.</li>
          <li>Verify plugin docs options match `GenGenPluginOptions` in `src/vite-plugin.ts`.</li>
          <li>Spot-check warning/error text in troubleshooting against actual runtime strings.</li>
          <li>Confirm each docs page has a working "Edit on GitHub" link.</li>
        </ol>
      </section>
    </DocsArticle>
  );
}
