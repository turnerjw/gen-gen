import {createFileRoute} from "@tanstack/react-router";

import {DocsArticle} from "@/components/docs-article";

export const Route = createFileRoute("/docs/api")({
  component: DocsApiPage,
});

function DocsApiPage() {
  return (
    <DocsArticle
      title="API Reference"
      summary="Use generateDataFile programmatically for scripts, custom build steps, or fine-grained control."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Import</h2>
        <pre className="overflow-auto rounded-md bg-muted p-3 text-sm">
{`import {generateDataFile} from "gen-gen";`}
        </pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">GenerateOptions</h2>
        <pre className="overflow-auto rounded-md bg-muted p-3 text-sm">
{`interface GenerateOptions {
  input?: string;
  cwd?: string;
  markerText?: string;
  write?: boolean;
  failOnWarn?: boolean;
  propertyPolicy?: {
    optionalProperties?: "include" | "omit";
    readonlyProperties?: "include" | "warn";
    indexSignatures?: "ignore" | "warn";
  };
  deepMerge?: boolean;
  typeMappingPresets?: Array<"common" | "commerce">;
  include?: string[];
  exclude?: string[];
  fakerOverrides?: Record<string, string | ((faker) => unknown)>;
  fakerStrategy?: (ctx) => string | ((faker) => unknown) | {expression: string; invokeMode?: "raw" | "call" | "callWithFaker"} | undefined;
}`}
        </pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">GenerateResult</h2>
        <pre className="overflow-auto rounded-md bg-muted p-3 text-sm">
{`interface GenerateResult {
  inputPath: string;
  changed: boolean;
  content: string;
  watchedFiles: string[];
  warnings: string[];
}`}
        </pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Example</h2>
        <pre className="overflow-auto rounded-md bg-muted p-3 text-sm">
{`const result = await generateDataFile({
  input: "data-gen.ts",
  write: false,
  typeMappingPresets: ["common"],
  fakerStrategy(ctx) {
    if (ctx.path.endsWith("email")) {
      return "faker.internet.email()";
    }
    return undefined;
  },
});

if (result.warnings.length > 0) {
  console.warn(result.warnings.join("\n"));
}`}
        </pre>
      </section>
    </DocsArticle>
  );
}
