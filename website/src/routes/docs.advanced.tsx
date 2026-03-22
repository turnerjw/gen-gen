import {createFileRoute} from "@tanstack/react-router";

import {CodeBlock} from "@/components/code-block";
import {DocsArticle} from "@/components/docs-article";

export const Route = createFileRoute("/docs/advanced")({
  component: DocsAdvancedPage,
});

function DocsAdvancedPage() {
  return (
    <DocsArticle
      title="Advanced Behavior"
      summary="Deep merge semantics, ignore tags, helper ergonomics, union handling, and diagnostics/policy behavior."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Deep merge vs shallow merge</h2>
        <p>Default generation applies shallow spread for overrides. Use `--deep-merge` to recursively merge nested objects.</p>
        <CodeBlock
          language="bash"
          code={`# shallow (default)
gen-gen --input data-gen.ts

# deep merge
gen-gen --input data-gen.ts --deep-merge`}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Ignore tags and policies</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>`@gen-gen-ignore` on a type skips root generator emission for that type.</li>
          <li>`@gen-gen-ignore` on a property emits a typed placeholder (`undefined as unknown as T` or `{}` for objects).</li>
          <li>Property policy supports optional, readonly, and index-signature behaviors.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Helper ergonomics</h2>
        <p>Generated functions accept object overrides or callback overrides with nested helpers:</p>
        <CodeBlock
          language="ts"
          code={`const order = generateOrder(({generateCustomer, generateItemsItem}) => ({
  customer: generateCustomer({email: "test@example.com"}),
  items: [generateItemsItem({quantity: 2})],
}));`}
        />
        <ul className="list-disc space-y-1 pl-5">
          <li>`generateX` helper names map to nested object fields.</li>
          <li>`generateXItem` helper names map to object-array item fields (first mergeable object element template).</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Union behavior</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>String/number literal unions use `faker.helpers.arrayElement([...])`.</li>
          <li>Boolean literal unions (`true | false`) use `faker.datatype.boolean()`.</li>
          <li>Object unions are generated as branches and sampled with `arrayElement`.</li>
          <li>`T | null` and `T | undefined` use random presence (`faker.datatype.boolean() ? value : null/undefined`).</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Watch diagnostics</h2>
        <p>
          `--watch-diagnostics` logs watch trigger file paths plus per-run metrics (`elapsed`, `changed`, warnings count,
          and watched file count).
        </p>
      </section>
    </DocsArticle>
  );
}
