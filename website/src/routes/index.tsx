import {Link, createFileRoute} from "@tanstack/react-router";

import {Button} from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const features = [
  {
    title: "Nested Helpers",
    body: "Override deeply nested branches with generated helper callbacks instead of brittle object replacement.",
  },
  {
    title: "Deep Merge Option",
    body: "Switch from shallow override spread to recursive merge when you need concise nested test overrides.",
  },
  {
    title: "Faker Overrides",
    body: "Provide custom faker expressions by path or type key to match your domain formats.",
  },
  {
    title: "Strategy + Presets",
    body: "Apply preset mappings and policy controls for optional, readonly, and index-signature behavior.",
  },
  {
    title: "Include/Exclude Filters",
    body: "Generate only the factories you need for a test target, package, or feature slice.",
  },
  {
    title: "Watch Diagnostics",
    body: "Track regeneration triggers and run metrics during watch mode for faster feedback loops.",
  },
];

const snippets = [
  {
    title: "CLI",
    code: "gen-gen --input data-gen.ts --watch --watch-diagnostics",
  },
  {
    title: "API",
    code: "const output = generateFactories({ sourcePath: 'data-gen.ts', deepMerge: true });",
  },
  {
    title: "Vite Plugin",
    code: "plugins: [genGenPlugin({ input: 'data-gen.ts', deepMerge: true })]",
  },
];

const examples = [
  {title: "Basics", description: "Simple interface generation and overrides", link: "/docs/getting-started"},
  {title: "CLI", description: "Flags, watch mode, diagnostics", link: "/docs/cli"},
  {title: "Docs Overview", description: "Capabilities and workflow", link: "/docs"},
];

function HomePage() {
  return (
    <div className="space-y-16 md:space-y-20">
      <section className="relative overflow-hidden rounded-3xl border bg-card p-8 shadow-sm md:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-secondary/30 blur-3xl" aria-hidden="true" />
        <div className="relative space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Type-Safe Test Data Generation</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
            Generate realistic test factories directly from TypeScript types.
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
            `gen-gen` turns your existing type model into composable factory functions so tests stay deterministic, readable,
            and fast to evolve.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/docs/getting-started">
              <Button size="lg">Start with Docs</Button>
            </Link>
            <Link to="/playground">
              <Button size="lg" variant="secondary">
                Open Playground
              </Button>
            </Link>
            <a href="https://github.com/justinturner/gen-gen" target="_blank" rel="noreferrer" className="inline-flex">
              <Button size="lg" variant="ghost">
                View GitHub
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section aria-labelledby="features-title" className="space-y-5">
        <h2 id="features-title" className="text-2xl font-semibold tracking-tight md:text-3xl">
          Built for modern test workflows
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-xl border bg-card p-5">
              <h3 className="text-lg font-medium">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="how-title" className="grid gap-4 md:grid-cols-3">
        <h2 id="how-title" className="md:col-span-3 text-2xl font-semibold tracking-tight md:text-3xl">
          How it works
        </h2>
        <article className="rounded-xl border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">1. Import Types</p>
          <p className="mt-2 text-sm">Point `gen-gen` at a source file that references your domain interfaces and aliases.</p>
        </article>
        <article className="rounded-xl border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">2. Run Generator</p>
          <p className="mt-2 text-sm">Generate factories from CLI, script, or Vite plugin and keep them up to date in watch mode.</p>
        </article>
        <article className="rounded-xl border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">3. Override in Tests</p>
          <p className="mt-2 text-sm">Customize output with partial overrides or nested helper callbacks for scenario-specific fixtures.</p>
        </article>
      </section>

      <section aria-labelledby="quickstart-title" className="space-y-5">
        <h2 id="quickstart-title" className="text-2xl font-semibold tracking-tight md:text-3xl">
          Quickstart snippets
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {snippets.map((snippet) => (
            <article key={snippet.title} className="rounded-xl border bg-card p-5">
              <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{snippet.title}</h3>
              <pre className="mt-3 overflow-auto rounded-md bg-muted p-3 text-xs">
                <code>{snippet.code}</code>
              </pre>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="examples-title" className="space-y-5">
        <h2 id="examples-title" className="text-2xl font-semibold tracking-tight md:text-3xl">
          Explore examples
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {examples.map((example) => (
            <article key={example.title} className="flex flex-col rounded-xl border bg-card p-5">
              <h3 className="text-lg font-medium">{example.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{example.description}</p>
              <Link to={example.link} className="mt-4 inline-flex text-sm font-medium text-primary hover:opacity-80">
                Open page
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="positioning-title" className="rounded-3xl border bg-card p-8 md:p-10">
        <h2 id="positioning-title" className="text-2xl font-semibold tracking-tight md:text-3xl">
          Why teams use this for tests
        </h2>
        <p className="mt-4 max-w-3xl text-sm text-muted-foreground md:text-base">
          Generated factories reduce fixture drift by deriving values from your source-of-truth types. You keep expressive test
          setup while removing repetitive handwritten builders and inconsistent mock payloads.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="https://www.npmjs.com/package/gen-gen" target="_blank" rel="noreferrer" className="inline-flex">
            <Button>Install from npm</Button>
          </a>
          <Link to="/docs" className="inline-flex">
            <Button variant="secondary">Read full docs</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
