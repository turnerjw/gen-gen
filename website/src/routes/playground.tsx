import {useMemo, useState} from "react";
import {createFileRoute} from "@tanstack/react-router";

import {Button} from "@/components/ui/button";
import {generateFactoryFromSource} from "@/lib/playground";

export const Route = createFileRoute("/playground")({
  component: PlaygroundPage,
});

const STARTER_INPUT = `interface Address {
  city: string;
  country: string;
}

interface User {
  id: string;
  age: number;
  active: boolean;
  address: Address;
  tags: string[];
}`;

function PlaygroundPage() {
  const [input, setInput] = useState(STARTER_INPUT);
  const [output, setOutput] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [copied, setCopied] = useState(false);

  const generated = useMemo(() => {
    if (!autoGenerate) {
      return null;
    }

    return generateFactoryFromSource(input);
  }, [autoGenerate, input]);

  const currentOutput = generated ? generated.code : output;
  const currentErrors = generated ? generated.errors : errors;

  function handleGenerate() {
    const result = generateFactoryFromSource(input);
    setOutput(result.code);
    setErrors(result.errors);
  }

  async function handleCopy() {
    if (!currentOutput) {
      return;
    }

    await navigator.clipboard.writeText(currentOutput);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section aria-labelledby="playground-title" className="space-y-6">
      <header className="space-y-2">
        <h1 id="playground-title" className="text-3xl font-semibold tracking-tight md:text-4xl">
          Type Playground
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
          Paste TypeScript types and generate a starter factory instantly. MVP supports in-file declarations only.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
        <Button onClick={handleGenerate}>Generate</Button>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoGenerate}
            onChange={(event) => setAutoGenerate(event.target.checked)}
            className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
          />
          Auto-generate
        </label>
        <Button variant="secondary" onClick={handleCopy} disabled={!currentOutput}>
          {copied ? "Copied" : "Copy Output"}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Input TypeScript</h2>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            spellCheck={false}
            className="h-[460px] w-full rounded-xl border bg-card p-4 font-mono text-sm leading-relaxed outline-none ring-ring transition focus:ring-2"
            aria-label="TypeScript input"
          />
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-medium">Generated Output</h2>
          <textarea
            value={currentOutput}
            readOnly
            spellCheck={false}
            className="h-[460px] w-full rounded-xl border bg-card p-4 font-mono text-sm leading-relaxed outline-none"
            aria-label="Generated output"
          />
        </section>
      </div>

      {currentErrors.length > 0 ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" aria-live="polite">
          <h2 className="font-medium">Diagnostics</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {currentErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
