# gen-gen

`gen-gen` generates Faker-based test data factories from imported TypeScript types.

Track implemented and planned features in [PROGRESS.md](./PROGRESS.md).

## Install

```bash
npm install -D @trnr/gen-gen typescript @faker-js/faker
```

## Quick example

Given a type like `Pokemon`, gen-gen produces:

```ts
export function generatePokemon(overrides?: Partial<Pokemon>): Pokemon {
  return {
    id: faker.number.int({ min: 1, max: 1000 }),
    name: faker.word.noun(),
    type: faker.word.noun(),
    ...overrides,
  };
}
```

Overrides accept either a `Partial<T>` object or a callback that receives nested generator helpers:

```ts
const data = generateUnnamedNestedExample(({ generateB }) => ({
  a: "Test",
  b: generateB({ d: true }),
}));
```

## CLI

```bash
gen-gen --input example/basic/data-gen.ts
```

| Option | Description |
|---|---|
| `-i, --input <path>` | Input file (default `data-gen.ts`) |
| `--cwd <path>` | Working directory to resolve `--input` |
| `--check` | Exit with code `1` if generated section is stale |
| `--dry-run` | Print resulting file instead of writing |
| `--fail-on-warn` | Fail when warnings are emitted |
| `-w, --watch` | Regenerate on changes |

## Vite plugin

```ts
import { defineConfig } from "vite";
import { genGenPlugin } from "@trnr/gen-gen";

export default defineConfig({
  plugins: [
    genGenPlugin({
      input: "data-gen.ts",
      failOnWarn: true,
    }),
  ],
});
```

## Input file shape

The input file should:

1. Import the types you want factories for.
2. Include a marker comment containing `Generated below - DO NOT EDIT`.

Optional features:

- `type ConcreteGenerics = [...]` — specify concrete generic instantiations.
- `type IncludeGenerators = [...]` / `type ExcludeGenerators = [...]` — filter generated targets.
- `const FakerOverrides = { ... }` — per-field/per-type faker expressions.
- `const GenGenConfig = { ... }` — generation options (see [Configuration](#configuration)).
- `@gen-gen-ignore` on types or properties — skip generation.

```ts
import type { APIResponse, Pokemon } from "./types";

type ConcreteGenerics = [APIResponse<Pokemon>];

const FakerOverrides = {
  email: () => faker.internet.email(),
  "Pokemon.id": () => faker.number.int({ min: 10000, max: 99999 }),
} as const;

/**
 * Generated below - DO NOT EDIT
 */
```

### Faker override matching

Override keys are matched in priority order:

1. `<RootType>.<path.to.field>` (e.g. `Pokemon.id`)
2. `path.to.field` (e.g. `profile.locale`)
3. Final property name (e.g. `email`)
4. Type text (e.g. `APIResponse<Pokemon>`)

Unused override keys emit warnings.

### Configuration

Use `const GenGenConfig = { ... } as const` in your input file:

```ts
const GenGenConfig = {
  deepMerge: true,
  optionalProperties: "omit",
  indexSignatures: "warn",
} as const;
```

| Option | Values | Default | Description |
|---|---|---|---|
| `deepMerge` | `true` / `false` | `false` | Merge overrides recursively instead of shallow spread |
| `optionalProperties` | `"include"` / `"omit"` | `"include"` | Include or omit optional properties in generated objects |
| `indexSignatures` | `"ignore"` / `"warn"` | `"ignore"` | Warn when index signatures are present but not materialized |

### Generic naming

Function names are built from generic arguments followed by the base type:
`B<A>` → `generateAB`, `A<B, C, D>` → `generateBCDA`.

## Type handling

- **Literal unions** (`"a" | "b"`, `1 | 2 | 3`) — `faker.helpers.arrayElement(...)`
- **Boolean literal unions** (`true | false`) — `faker.datatype.boolean()`
- **Object unions** (including discriminated) — generates one branch, selects via `faker.helpers.arrayElement(...)`
- **Mixed unions** (`string | number | { ... }`) — samples across all concrete members
- **Enums** — generated from declared member values, cast to enum type
- **Branded/opaque primitives** (`string & { __brand: "X" }`) — faker primitive value cast to alias type

## API

```ts
import { generateDataFile } from "@trnr/gen-gen";

const result = await generateDataFile({
  input: "data-gen.ts",
  cwd: process.cwd(),
  write: true,
  failOnWarn: false,
});

result.changed;      // whether the file was modified
result.warnings;     // any warnings emitted
result.content;      // the full file content
result.watchedFiles; // files that should trigger regeneration
```

## Development

```bash
bun run build
bun run typecheck
bun test
```
