import {useCallback, useMemo, useRef, useState} from "react";
import {createFileRoute} from "@tanstack/react-router";
import {Highlight, themes} from "prism-react-renderer";

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

const EDITOR_HEIGHT = 460;
const EDITOR_STYLE = "font-family: 'JetBrains Mono', monospace; font-size: 14px; line-height: 1.625; tab-size: 2;";

function HighlightedPre({code, language}: {code: string; language: "tsx" | "typescript"}) {
  return (
    <Highlight code={code || " "} language={language} theme={themes.vsDark}>
      {({tokens, getLineProps, getTokenProps}) => (
        <pre
          className="pointer-events-none m-0 h-full w-max min-w-full whitespace-pre bg-transparent p-4"
          style={{...Object.fromEntries(EDITOR_STYLE.split(";").filter(Boolean).map((s) => {const [k, ...v] = s.split(":"); return [k.trim(), v.join(":").trim()];})), backgroundColor: "transparent"}}
        >
          {tokens.map((line, i) => {
            const lineProps = getLineProps({line});
            return (
              <div key={i} {...lineProps}>
                {line.length === 1 && line[0].empty ? "\n" : line.map((token, j) => <span key={j} {...getTokenProps({token})} />)}
              </div>
            );
          })}
        </pre>
      )}
    </Highlight>
  );
}

function PlaygroundPage() {
  const [input, setInput] = useState(STARTER_INPUT);
  const [output, setOutput] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const outputHighlightRef = useRef<HTMLDivElement>(null);

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

  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  return (
    <div className="min-h-[calc(100vh-var(--header-height))] bg-docs-surface">
      <section aria-labelledby="playground-title" className="mx-auto max-w-6xl space-y-8 px-8 py-10 md:px-16 md:py-14">
        <header className="space-y-3 border-b-brand border-docs-divider pb-5">
          <h1 id="playground-title" className="font-display text-3xl uppercase text-docs-heading md:text-4xl">
            Type Playground
          </h1>
          <p className="max-w-3xl text-sm text-docs-muted">
            Paste TypeScript types and generate a starter factory instantly. MVP supports in-file declarations only.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-foreground p-3">
          <Button onClick={handleGenerate}>Generate</Button>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm uppercase tracking-button text-docs-muted">
            <input
              type="checkbox"
              checked={autoGenerate}
              onChange={(event) => setAutoGenerate(event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Auto-generate
          </label>
          <button
            onClick={handleCopy}
            disabled={!currentOutput}
            className="border-2 border-[#444] bg-transparent px-3 py-1 text-[10px] uppercase tracking-button text-syntax-keyword transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-[#444] disabled:hover:text-syntax-keyword"
          >
            {copied ? "Copied" : "Copy Output"}
          </button>
        </div>

        <div className="grid gap-[3px] overflow-hidden rounded-lg bg-docs-divider lg:grid-cols-2">
          {/* Input — editable overlay */}
          <section>
            <h2 className="bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-label text-docs-muted">Input TypeScript</h2>
            <div className="relative" style={{height: EDITOR_HEIGHT}}>
              <div
                ref={highlightRef}
                className="absolute inset-0 overflow-hidden bg-syntax-surface"
                aria-hidden="true"
              >
                <HighlightedPre code={input} language="typescript" />
              </div>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onScroll={syncScroll}
                spellCheck={false}
                className="absolute inset-0 h-full w-full resize-none bg-transparent p-4 text-transparent caret-primary outline-none selection:bg-primary/30"
                style={{...Object.fromEntries(EDITOR_STYLE.split(";").filter(Boolean).map((s) => {const [k, ...v] = s.split(":"); return [k.trim(), v.join(":").trim()];}))}}
                aria-label="TypeScript input"
              />
            </div>
          </section>

          {/* Output — read-only highlighted */}
          <section>
            <h2 className="bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-label text-docs-muted">Generated Output</h2>
            <div
              ref={outputHighlightRef}
              className="overflow-auto bg-syntax-surface"
              style={{height: EDITOR_HEIGHT}}
            >
              <HighlightedPre code={currentOutput} language="tsx" />
            </div>
          </section>
        </div>

        {currentErrors.length > 0 ? (
          <section className="rounded-lg border-brand border-primary bg-primary/10 p-4 text-sm text-docs-text" aria-live="polite">
            <h2 className="font-display text-sm uppercase text-docs-heading">Diagnostics</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-docs-text">
              {currentErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </section>
    </div>
  );
}
