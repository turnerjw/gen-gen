import {createFileRoute} from "@tanstack/react-router";

import {DocsArticle} from "@/components/docs-article";

export const Route = createFileRoute("/docs/examples")({
  component: DocsExamplesPage,
});

function DocsExamplesPage() {
  return (
    <DocsArticle
      title="Examples"
      summary="Copy-paste commands and snippets synchronized with the /example directory in this repository."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Folders</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>`example/basic`: nested helper callback usage</li>
          <li>`example/generics`: `ConcreteGenerics`</li>
          <li>`example/unions`: literal + object unions</li>
          <li>`example/deep-merge`: deep-merge behavior</li>
          <li>`example/filters`: include/exclude filters</li>
          <li>`example/custom-faker`: overrides + custom expressions</li>
          <li>`example/ignore`: `@gen-gen-ignore` behavior</li>
          <li>`example/policy`: optional/readonly/index-signature policy</li>
          <li>`example/branded`: branded primitive aliases</li>
          <li>`example/enums`: enum member generation</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Generate all examples</h2>
        <pre className="overflow-auto rounded-md bg-muted p-3 text-sm">{`bun run gen:example`}</pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Targeted commands</h2>
        <pre className="overflow-auto rounded-md bg-muted p-3 text-sm">
{`bun ./dist/cli.js --input example/basic/data-gen.ts
bun ./dist/cli.js --input example/unions/data-gen-unions.ts
bun ./dist/cli.js --input example/deep-merge/data-gen-deep-merge.ts --deep-merge
bun ./dist/cli.js --input example/custom-faker/data-gen-custom-faker.ts --faker-override email=faker.internet.email()`}
        </pre>
      </section>
    </DocsArticle>
  );
}
