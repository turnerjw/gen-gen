import {createFileRoute} from "@tanstack/react-router";

import {DocsArticle} from "@/components/docs-article";

export const Route = createFileRoute("/docs/faker-overrides")({
  component: DocsFakerOverridesPage,
});

function DocsFakerOverridesPage() {
  return (
    <DocsArticle
      title="Faker Overrides and Strategies"
      summary="Override matching order, precedence rules, and strategy hooks for scalable custom data generation."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Override key matching order</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>`&lt;RootType&gt;.&lt;path.to.field&gt;` (example: `Pokemon.id`)</li>
          <li>`path.to.field` (example: `profile.locale`)</li>
          <li>Final property name (example: `email`)</li>
          <li>Declared type text (when available)</li>
          <li>Type alias name</li>
          <li>Resolved type text (example: `APIResponse&lt;Pokemon&gt;`)</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Precedence</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Direct `fakerOverrides` match</li>
          <li>`fakerStrategy` return value</li>
          <li>`typeMappingPresets` match</li>
          <li>Built-in default type generation</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">CLI overrides</h2>
        <pre className="overflow-auto rounded-md bg-muted p-3 text-sm">
{`npx gen-gen --input data-gen.ts \\
  --faker-override email=faker.internet.email() \\
  --faker-override Pokemon.id=faker.number.int({min:10000,max:99999})`}
        </pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Strategy module (CLI)</h2>
        <pre className="overflow-auto rounded-md bg-muted p-3 text-sm">
{`npx gen-gen --input data-gen.ts --faker-strategy ./faker-strategy.ts`}
        </pre>
        <pre className="overflow-auto rounded-md bg-muted p-3 text-sm">
{`export default function fakerStrategy(ctx) {
  if (ctx.rootTypeText === "User" && ctx.path === "id") {
    return {expression: "faker.string.uuid()", invokeMode: "raw"};
  }
  if (ctx.path.endsWith("email")) {
    return (faker) => faker.internet.email();
  }
  return undefined;
}`}
        </pre>
      </section>

      <section className="space-y-3">
        <p className="text-muted-foreground">
          Unused override keys emit warnings so typos and stale mappings are visible during generation.
        </p>
      </section>
    </DocsArticle>
  );
}
