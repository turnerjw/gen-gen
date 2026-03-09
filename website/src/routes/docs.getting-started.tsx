import {createFileRoute} from "@tanstack/react-router";

import {DocsArticle} from "@/components/docs-article";

export const Route = createFileRoute("/docs/getting-started")({
  component: DocsGettingStartedPage,
});

function DocsGettingStartedPage() {
  return (
    <DocsArticle
      title="Getting Started"
      summary="Install gen-gen, create a data-gen input file, and generate your first factories in under five minutes."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Install</h2>
        <pre className="overflow-auto rounded-md bg-muted p-3 text-sm">
{`npm install -D gen-gen typescript @faker-js/faker`}
        </pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Create input file</h2>
        <p>Create `data-gen.ts` and import the types you want factory functions for:</p>
        <pre className="overflow-auto rounded-md bg-muted p-3 text-sm">
{`import type {Pokemon} from "./types";

/**
 * Generated below - DO NOT EDIT
 */`}
        </pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Run generation</h2>
        <pre className="overflow-auto rounded-md bg-muted p-3 text-sm">
{`npx gen-gen --input data-gen.ts`}
        </pre>
        <p>
          `gen-gen` replaces everything after the marker and emits functions like `generatePokemon(overrides?)`.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Use generated helpers</h2>
        <pre className="overflow-auto rounded-md bg-muted p-3 text-sm">
{`const user = generateUser(({generateProfile}) => ({
  profile: generateProfile({locale: "en-CA"}),
}));`}
        </pre>
        <p>
          Helper callbacks include object helpers (`generateProfile`) and array-item helpers (`generateItemsItem`) for
          nested object arrays.
        </p>
      </section>
    </DocsArticle>
  );
}
