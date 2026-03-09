import {createFileRoute} from "@tanstack/react-router";

import {DocsArticle} from "@/components/docs-article";

export const Route = createFileRoute("/docs/presets")({
  component: DocsPresetsPage,
});

function DocsPresetsPage() {
  return (
    <DocsArticle
      title="Type Mapping Presets"
      summary="Presets provide convention-based mappings for common property names before falling back to generic faker defaults."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Available presets</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>`common`: fields like `email`, `url`, `phone`, `firstName`, `lastName`, `username`, `id`.</li>
          <li>`commerce`: fields like `currency`, `amount`, `price`, `subtotal`, `total`, `tax`.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">CLI</h2>
        <pre className="overflow-auto rounded-md bg-muted p-3 text-sm">{`npx gen-gen --input data-gen.ts --preset common,commerce`}</pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">API / plugin</h2>
        <pre className="overflow-auto rounded-md bg-muted p-3 text-sm">
{`generateDataFile({
  input: "data-gen.ts",
  typeMappingPresets: ["common", "commerce"],
});`}
        </pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Interaction with overrides</h2>
        <p>
          Presets run after direct `fakerOverrides` and `fakerStrategy`. If you need strict control for a field, define an
          explicit override key or strategy rule for that field.
        </p>
      </section>
    </DocsArticle>
  );
}
