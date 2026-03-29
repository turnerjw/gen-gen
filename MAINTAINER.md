# Maintainer Guide

## Architecture overview

gen-gen reads a TypeScript "data-gen" file, uses the TypeScript Compiler API to resolve imported types, and emits factory functions that produce fake data using `@faker-js/faker`. The generated code is written back into the same data-gen file below a marker comment.

Three execution surfaces invoke the same core engine:

- **CLI** (`cli.ts` / `cli-core.ts`) -- one-shot generation or long-running watch mode.
- **Vite plugin** (`vite-plugin.ts`) -- runs generation on `buildStart` and re-runs on HMR file changes.
- **Programmatic API** (`index.ts`) -- exports `generateDataFile()` and the Vite plugin factory for direct use.

Both the CLI watch mode and the Vite plugin create a **TypeScript Language Service** instance that is reused across regeneration cycles. This avoids calling `ts.createProgram()` from scratch on every file change -- only modified files are re-checked. One-shot CLI runs still create a fresh program since there is no benefit to caching.

## Key files

| File | Responsibility |
|---|---|
| `generator.ts` | The entire generation engine: type parsing, config/override/strategy collection, type traversal, code emission, merge logic, warning collection. This is the largest file by far. |
| `cli.ts` | Thin entry point. Calls `main()` from `cli-core.ts` and handles top-level errors. |
| `cli-core.ts` | Argument parsing (`parseArgs`), help text, watch mode runtime (`createWatchModeRuntime`, `runWatchMode`), Language Service creation for watch mode. |
| `vite-plugin.ts` | Vite plugin factory (`createGenGenPlugin` / `genGenPlugin`). Manages its own Language Service instance, tracks watched files, handles `configureServer` watcher integration. |
| `index.ts` | Public API surface. Re-exports `generateDataFile`, `genGenPlugin`, and the key types (`GenerateOptions`, `GenerateResult`, `GenGenConfigOptions`, `FakerStrategyContext`, `FakerStrategyResult`, `GenGenPluginOptions`). |

## How generation works

The pipeline inside `generateDataFile()`:

1. **Parse targets** (`parseTargets`) -- Creates a TypeScript program (or reuses one from a Language Service). Walks the source file's AST to collect:
   - **Import targets**: type-only imports become generation targets. Generic types are skipped (they need a `ConcreteGenerics` entry).
   - **ConcreteGenerics**: a tuple type alias listing concrete instantiations of generic types (e.g., `[APIResponse<User>]`).
   - **IncludeGenerators / ExcludeGenerators**: tuple type aliases for filtering which types get generators.
   - **FakerOverrides**: a `const FakerOverrides = { ... }` object mapping dotted paths to faker expressions or functions.
   - **FakerStrategy**: a `const FakerStrategy = (ctx) => { ... }` function providing programmatic override logic.
   - **GenGenConfig**: a `const GenGenConfig = { ... }` object for project-level settings (deepMerge, optionalProperties, indexSignatures).
   - **Watched files**: all non-`node_modules`, non-`.d.ts` source files in the program, used for watch mode.

2. **Resolve config** -- Merge file-level `GenGenConfig` with API-level options. File config is the base; API options override (useful for CI flags like `failOnWarn`).

3. **Emit functions** (`emitFunctions`) -- For each target:
   - Build a `GenerationContext` with caches, override maps, and policy settings.
   - Emit the shared helper runtime (deep merge utilities, `GenGenHelpers<T>` mapped type, `__genGenCreateHelper` factory).
   - For each target type, emit a factory function via `emitFunction` -> `emitObjectLiteral` -> `emitExpression`. The expression emitter recursively handles objects, arrays, unions, enums, branded types, primitives, dates, and circular references.
   - Collect all visited property paths for the `FakerOverridePaths` union type.
   - Emit the `FakerOverridePaths` and `TypedFakerOverrides` utility types.

4. **Collect warnings** -- Unused faker override keys (with nearest-match suggestions), unmatched include/exclude filters, skipped types.

5. **Merge with existing output** (`replaceGeneratedSection`) -- Find the marker comment block (`Generated below - DO NOT EDIT`) in the original file, replace everything below it with the new generated code. Also ensures the faker import is present (`ensureFakerImport`).

6. **Write** -- If `write: true` and content changed, write back to disk. Return the result with `changed`, `content`, `warnings`, and `watchedFiles`.

## Release process

This project uses [Changesets](https://github.com/changesets/changesets) for versioning and npm publishing.

### Versioning policy

- Current version: `0.1.0` (pre-stable `0.x` line).
- `1.0.0` will be cut after explicit API-stability signoff.

### Authoring a release

1. Make code changes and add a changeset: `bun run changeset`.
2. Commit the generated `.changeset/*.md` file with the PR.
3. Merge to `main`.

For docs-only or internal changes, a changeset is not required.

### How the release workflow runs

1. On push to `main`, the `Release` workflow fires.
2. The `changesets/action` step does one of two things:
   - If unreleased changesets exist: opens or updates a "chore: version packages" PR with bumped versions and updated changelog.
   - If the version PR commit lands on `main`: publishes to npm with provenance.
3. Pre-publish gates run before any publish: typecheck, test, build, gen:example.

### Local commands

| Command | Purpose |
|---|---|
| `bun run changeset` | Create a new changeset |
| `bun run changeset:version` | Apply version bumps locally |
| `bun run changeset:publish -- --access public --provenance` | Manual publish fallback |

### Verification after publish

1. Confirm package and version on [npmjs.com/package/gen-gen](https://npmjs.com/package/gen-gen).
2. In a clean directory: `npm i -D gen-gen typescript @faker-js/faker && npx gen-gen --input data-gen.ts`.
3. Smoke-test runtime output.

## CI/CD

### `ci.yml` -- Quality Gates

Runs on PRs to `main` and pushes to `main`. Two jobs:

- **Quality Gates**: `bun install --frozen-lockfile`, then `typecheck`, `test`, `build`. (The `gen:example` step is currently commented out.)
- **Changeset Required** (PR-only): runs `changeset status --since=origin/$BASE_REF` to enforce that user-facing PRs include a changeset.

### `release.yml` -- Version and Publish

Runs on pushes to `main` only. Single job:

1. Install, typecheck, test, build, gen:example (all as pre-publish gates).
2. Configure npm auth using `NPM_TOKEN` from repository secrets.
3. Run `changesets/action@v1` to either open a version PR or publish to npm.

### Required secrets

| Secret | Where | Purpose |
|---|---|---|
| `NPM_TOKEN` | GitHub repository secrets | npm publish authentication |
| `GITHUB_TOKEN` | Automatic | Changesets PR creation and merging |

### Required permissions

The release workflow needs `contents: write`, `pull-requests: write`, and `id-token: write` (for npm provenance).

## Remaining TODO items

### From the release checklist

Two items from the original release plan remain incomplete:

1. **Dry-run publish in CI** -- Add a `changeset publish --dry-run` step to the CI workflow so publish problems are caught before the actual release.
2. **Verify npm install in a clean fixture project** -- Set up an automated post-publish verification that installs `@trnr/gen-gen` in a fresh project and runs a generation cycle.

### Codex skill

`TODO_SKILL.md` tracks the plan for a Codex skill that helps users adopt and operate gen-gen (bootstrap data-gen files, recommend overrides vs strategies, diagnose warnings). No work has started on this.

## Design decisions

### Why deep merge is the default

Shallow merge (`Object.assign` / spread) drops sibling fields when you override a nested property. For test data builders, this is almost never what you want -- you typically override one field deep in an object and expect the rest to remain intact. Deep merge is the safe default. Users can opt out with `deepMerge: false` in `GenGenConfig` if they need explicit full-object replacement.

### Why config lives in the data-gen file, not the API/CLI

Project-specific settings (`deepMerge`, `optionalProperties`, `indexSignatures`, `FakerOverrides`, `FakerStrategy`, `IncludeGenerators`, `ExcludeGenerators`) are declared in the data-gen file itself rather than passed through the API or CLI flags. This keeps configuration co-located with the types and overrides it applies to, makes the data-gen file self-contained, and means the CLI and Vite plugin need only operational flags (`--input`, `--watch`, `--check`, `--fail-on-warn`, `--dry-run`). The API still accepts options that override file-level config, which is useful for CI (e.g., forcing `failOnWarn: true`).

### Why Language Service over createProgram for watch/plugin

`ts.createProgram()` rebuilds the entire type-checking state from scratch on every call. In watch mode and the Vite plugin, this means re-analyzing every file on every save. `ts.createLanguageService()` maintains an internal cache keyed by file versions -- only changed files are re-checked. The first run is equivalent in cost, but subsequent runs in watch/plugin mode are significantly faster. One-shot CLI runs still use `createProgram` (via no Language Service being passed) since there is no second run to benefit from caching.
