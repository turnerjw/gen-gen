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
        <h1 id="playground-title" className="font-display text-2xl uppercase md:text-3xl">
          Type Playground
        </h1>
        <p className="max-w-3xl text-xs text-muted-foreground">
          Paste TypeScript types and generate a starter factory instantly. MVP supports in-file declarations only.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 border-[3px] border-foreground bg-secondary p-3">
        <Button onClick={handleGenerate}>Generate</Button>
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs uppercase tracking-[0.06em]">
          <input
            type="checkbox"
            checked={autoGenerate}
            onChange={(event) => setAutoGenerate(event.target.checked)}
            className="h-4 w-4 border-foreground accent-primary"
          />
          Auto-generate
        </label>
        <Button variant="secondary" onClick={handleCopy} disabled={!currentOutput}>
          {copied ? "Copied" : "Copy Output"}
        </Button>
      </div>

      <div className="grid gap-0 lg:grid-cols-2">
        <section className="space-y-2">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.15em]">Input TypeScript</h2>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            spellCheck={false}
            className="h-[460px] w-full border-[3px] border-foreground bg-[#0a0a0a] p-4 font-mono text-sm leading-relaxed text-[#e0e0e0] outline-none focus:border-primary"
            aria-label="TypeScript input"
          />
        </section>

        <section className="space-y-2">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.15em]">Generated Output</h2>
          <textarea
            value={currentOutput}
            readOnly
            spellCheck={false}
            className="h-[460px] w-full border-[3px] border-foreground bg-[#0a0a0a] p-4 font-mono text-sm leading-relaxed text-[#e0e0e0] outline-none lg:border-l-0"
            aria-label="Generated output"
          />
        </section>
      </div>

      {currentErrors.length > 0 ? (
        <section className="border-[3px] border-primary bg-primary/5 p-4 text-sm text-foreground" aria-live="polite">
          <h2 className="font-display text-sm uppercase">Diagnostics</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
            {currentErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
