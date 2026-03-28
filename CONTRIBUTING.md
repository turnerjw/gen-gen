# Contributing to gen-gen

## Prerequisites

- **Bun** (latest) -- runtime, package manager, and test runner
- **Node.js** >= 18 -- required by some tooling (Changesets, TypeScript CLI)
- **TypeScript** >= 5.9.3 -- listed as a peer dependency in `packages/gen-gen/package.json`

## Getting started

```bash
git clone https://github.com/turnerjw/gen-gen.git
cd gen-gen
bun install
bun run build          # compile packages/gen-gen → dist/
bun run test           # run the full test suite
bun run typecheck      # strict TypeScript check
```

## Project structure

This is a Bun workspaces monorepo. Root `package.json` declares two workspaces:

```
gen-gen/
  packages/gen-gen/       # the npm package (library + CLI + Vite plugin)
    src/
      generator.ts        # core generation engine
      cli.ts              # CLI entry point (thin wrapper)
      cli-core.ts         # CLI argument parsing, watch mode runtime
      vite-plugin.ts      # Vite plugin factory
      index.ts            # public API re-exports
    test/                 # bun:test test suites
    example/              # example fixture projects (basic, unions, generics, etc.)
    dist/                 # compiled output (git-ignored)
  website/                # docs and playground (TanStack Router + Tailwind)
  scripts/                # one-off automation scripts
  .changeset/             # Changesets config and pending changesets
  .github/workflows/      # CI and Release GitHub Actions
```

## Development workflow

**Watch mode (library):**

```bash
bun run dev
```

This runs `tsc --watch` on `packages/gen-gen` and the website dev server in parallel.

**Run tests:**

```bash
bun run test
```

Tests use `bun:test`. They are fixture-based: each test creates a temporary directory under `.tmp/`, writes type files and a `data-gen.ts` stub, runs `generateDataFile()`, and asserts on the output. Temp directories are cleaned up in `afterEach`.

**Typecheck:**

```bash
bun run typecheck
```

**Full quality check (library + website):**

```bash
bun run check
```

This runs typecheck, tests, website typecheck, and website build sequentially.

## Making changes

### Branch conventions

Create a feature branch off `main`. There is no enforced naming scheme, but descriptive names help (e.g., `fix-enum-override`, `add-plural-helpers`).

### Adding a changeset

If your change affects the published `gen-gen` package (bug fix, new feature, breaking change), add a changeset:

```bash
bun run changeset
```

Follow the prompts to select the package and semver bump level (`patch`, `minor`, or `major`). This creates a markdown file in `.changeset/` -- commit it with your changes.

Changesets are **not required** for docs-only, test-only, or internal tooling changes.

## Testing guidelines

Tests live in `packages/gen-gen/test/`. The four test files map to source modules:

| Test file | What it covers |
|---|---|
| `generator.test.ts` | Core generation: type parsing, code emission, overrides, strategies, config, warnings |
| `cli-core.test.ts` | Argument parsing, `--check`/`--dry-run` behavior |
| `cli-watch.test.ts` | Watch mode: debounce, watcher refresh, diagnostics |
| `vite-plugin.test.ts` | Plugin lifecycle: `buildStart`, `configureServer`, watch file tracking |

### How to write a new test

1. Use `createFixture({ ... })` to set up a temp directory with `types.ts` and `data-gen.ts` files.
2. Call `generateDataFile({ cwd, write: false })` to get the result without writing to disk.
3. Assert on `result.content`, `result.changed`, and `result.warnings`.
4. Temp directories are created under `.tmp/` and automatically removed after each test.

Example:

```ts
test("handles my new case", async () => {
  const cwd = await createFixture({
    "types.ts": `export type Foo = { bar: string };`,
    "data-gen.ts": `
import type { Foo } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
`,
  });

  const result = await generateDataFile({ cwd, write: false });
  expect(result.content).toContain("export function generateFoo(");
});
```

## PR expectations

### What a good PR looks like

- Focused on one logical change.
- Includes a changeset if user-facing.
- Includes or updates tests for any behavior change.
- Passes all CI checks locally before pushing (`bun run typecheck && bun run test && bun run build`).

### CI checks that must pass

The `CI` workflow runs on every PR to `main`:

1. **Quality Gates** -- `bun run typecheck`, `bun run test`, `bun run build`
2. **Changeset Required** -- `changeset status` verifies a changeset is present for user-facing PRs (runs only on PRs, not pushes to `main`)

Both jobs must pass before merge.
