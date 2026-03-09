import {createFileRoute} from "@tanstack/react-router";

import {DocsArticle} from "@/components/docs-article";

export const Route = createFileRoute("/docs/playground")({
  component: DocsPlaygroundPage,
});

function DocsPlaygroundPage() {
  return (
    <DocsArticle
      title="Playground"
      summary="MVP playground guidance: supported input scope, known limitations, starter snippets, and typical parse errors."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Supported input scope (MVP)</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Single-file type declarations only.</li>
          <li>No external imports in playground mode.</li>
          <li>Object-like root types are supported generation targets.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Known limitations</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Cross-file symbol resolution is not available in playground scope.</li>
          <li>Output should be copied into project `data-gen.ts` files for persistent use.</li>
          <li>Large complex generic graphs may require simplifying to concrete aliases first.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Starter snippets</h2>
        <pre className="overflow-auto rounded-md bg-muted p-3 text-sm">
{`// 1) Basic object
type User = { id: string; email: string };

// 2) Union
type Contact = { kind: "email"; value: string } | { kind: "phone"; value: string };

// 3) Generic concrete type
type ApiResponse<T> = { data: T; error?: string };
type Concrete = ApiResponse<User>;`}
        </pre>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Typical parse/generation errors</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Non-object root type: generation target skipped.</li>
          <li>Invalid override keys: unused override warning.</li>
          <li>Unsupported imported symbol in playground scope: unresolved/unsupported target warning.</li>
        </ul>
      </section>
    </DocsArticle>
  );
}
