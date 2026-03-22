import {createFileRoute} from "@tanstack/react-router";

import {CodeBlock} from "@/components/code-block";
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
        <CodeBlock language="ts" code={`import {generateDataFile} from "gen-gen";`} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">GenerateOptions</h2>
        <CodeBlock
          language="ts"
          code={`interface GenerateOptions {
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
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">GenerateResult</h2>
        <CodeBlock
          language="ts"
          code={`interface GenerateResult {
  inputPath: string;
  changed: boolean;
  content: string;
  watchedFiles: string[];
  warnings: string[];
}`}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Example</h2>
        <CodeBlock
          language="ts"
          code={`const result = await generateDataFile({
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
        />
      </section>
    </DocsArticle>
  );
}
