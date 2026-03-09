import {createFileRoute} from "@tanstack/react-router";

import {DocsArticle} from "@/components/docs-article";

export const Route = createFileRoute("/docs/troubleshooting")({
  component: DocsTroubleshootingPage,
});

function DocsTroubleshootingPage() {
  return (
    <DocsArticle
      title="Troubleshooting"
      summary="Common CLI and generator warnings/errors with direct fixes based on real runtime messages."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Common CLI errors</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>`Unknown argument: ...`: remove invalid flags or check spelling.</li>
          <li>`--watch cannot be combined with --check or --dry-run`: run these modes separately.</li>
          <li>`Expected --faker-override in the format key=expression`: ensure `=` is present and both sides are non-empty.</li>
          <li>`Unknown preset(s): ... Allowed presets: common, commerce.`: use supported preset names only.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Generation warnings</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>`Unmatched include filters: ...` / `Unmatched exclude filters: ...`: update stale filter names.</li>
          <li>`Unused faker overrides: ...`: key did not match; verify path/type text against generated types.</li>
          <li>`Skipped imported type ... generic type requires ConcreteGenerics entry.`: add concrete generic entries.</li>
          <li>`... only object types are supported for generators.`: root targets must be object-like types.</li>
          <li>`Ignored FakerOverrides: expected an object literal.`: inline object literal required for in-file override parsing.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Debug flow</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Run once with `--dry-run` to inspect generated output without writing.</li>
          <li>Add `--fail-on-warn` in CI to stop on warning regressions.</li>
          <li>Use `--watch --watch-diagnostics` locally to inspect trigger and timing behavior.</li>
        </ol>
      </section>
    </DocsArticle>
  );
}
