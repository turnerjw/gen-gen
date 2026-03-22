import {createFileRoute} from "@tanstack/react-router";

import {CodeBlock} from "@/components/code-block";
import {DocsArticle} from "@/components/docs-article";

export const Route = createFileRoute("/docs/cli")({
  component: DocsCliPage,
});

function DocsCliPage() {
  return (
    <DocsArticle title="CLI Reference" summary="Complete command-line options, constraints, and copy-paste examples.">
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Usage</h2>
        <CodeBlock language="bash" code={`gen-gen [options]`} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Options</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>`-i, --input &lt;path&gt;`: input source file (default: `data-gen.ts`)</li>
          <li>`--cwd &lt;path&gt;`: working directory used to resolve `--input`</li>
          <li>`--check`: exits `1` when generated section is stale</li>
          <li>`--dry-run`: prints resulting file to stdout without writing</li>
          <li>`--fail-on-warn`: fails generation if warnings exist</li>
          <li>`--optional-properties &lt;include|omit&gt;`</li>
          <li>`--readonly-properties &lt;include|warn&gt;`</li>
          <li>`--index-signatures &lt;ignore|warn&gt;`</li>
          <li>`--faker-strategy &lt;path&gt;`: loads module default export or named `fakerStrategy` export</li>
          <li>`--preset &lt;name[,name...]&gt;`: `common`, `commerce`</li>
          <li>`-w, --watch`: continuous regeneration</li>
          <li>`--watch-diagnostics`: logs trigger source and per-run metrics</li>
          <li>`--deep-merge`: deep-merge object overrides instead of shallow top-level spread</li>
          <li>`--include &lt;csv&gt;`: include generators/types by filter keys</li>
          <li>`--exclude &lt;csv&gt;`: exclude generators/types by filter keys</li>
          <li>`--faker-override key=expression`: repeatable CLI override mapping</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Examples</h2>
        <CodeBlock
          language="bash"
          code={`# single run
npx gen-gen --input example/basic/data-gen.ts

# stale-check in CI
npx gen-gen --input data-gen.ts --check

# watch with diagnostics
npx gen-gen --input data-gen.ts --watch --watch-diagnostics

# deep merge + presets + filter
npx gen-gen --input data-gen.ts --deep-merge --preset common,commerce --include User,Account

# explicit faker override(s)
npx gen-gen --input data-gen.ts --faker-override email=faker.internet.email()`}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Notes</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>`--watch` cannot be combined with `--check` or `--dry-run`.</li>
          <li>Unknown include/exclude filters produce warnings (they do not silently fail).</li>
          <li>Unused faker override keys also produce warnings to surface typos.</li>
        </ul>
      </section>
    </DocsArticle>
  );
}
