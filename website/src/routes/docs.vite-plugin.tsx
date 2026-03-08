import {createFileRoute} from "@tanstack/react-router";

import {DocsArticle} from "@/components/docs-article";

export const Route = createFileRoute("/docs/vite-plugin")({
  component: DocsVitePluginPage,
});

function DocsVitePluginPage() {
  return (
    <DocsArticle
      title="Vite Plugin Reference"
      summary="genGenPlugin runs generation during Vite startup/build and watches relevant files for regeneration."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Setup</h2>
        <pre className="overflow-auto rounded-md bg-muted p-3 text-sm">
{`import {defineConfig} from "vite";
import {genGenPlugin} from "gen-gen";

export default defineConfig({
  plugins: [
    genGenPlugin({
      input: "data-gen.ts",
      failOnWarn: true,
      watchDiagnostics: true,
      deepMerge: true,
      include: ["User", "Account"],
      fakerOverrides: {
        email: "faker.internet.email()",
      },
    }),
  ],
});`}
        </pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Options</h2>
        <p>
          Plugin options mirror `generateDataFile` options with Vite-specific watch integration. Key options are `input`,
          `failOnWarn`, `propertyPolicy`, `deepMerge`, `typeMappingPresets`, `watchDiagnostics`, `include`, `exclude`,
          `fakerOverrides`, and `fakerStrategy`.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Watch behavior</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>When watched files change, generation runs again.</li>
          <li>If generated output changed, plugin sends a full reload.</li>
          <li>With `watchDiagnostics: true`, trigger file and per-run metrics are logged.</li>
        </ul>
      </section>
    </DocsArticle>
  );
}
