# gen-gen

`gen-gen` generates Faker-based test data factories from imported TypeScript types.

It reads a generator source file (default: `data-gen.ts`), then writes functions like:

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

## Install

```bash
npm install -D gen-gen typescript @faker-js/faker
```

## CLI

```bash
gen-gen --input example/data-gen.ts
```

Options:

- `-i, --input <path>`: input file (default `data-gen.ts`)
- `--cwd <path>`: working directory to resolve `--input`
- `--check`: exits with code `1` if the generated section is stale
- `--dry-run`: print resulting file contents instead of writing
- `-w, --watch`: run continuously and regenerate on changes

## Vite plugin

```ts
import {defineConfig} from "vite";
import {genGenPlugin} from "gen-gen";

export default defineConfig({
  plugins: [genGenPlugin({input: "data-gen.ts"})],
});
```

The plugin runs generation during build/dev startup and watches relevant source files.

## Input file shape

The input file should:

1. Import the types you want factories for.
2. Optionally define `type ConcreteGenerics = [...]` to specify concrete generic instantiations.
3. Include a marker comment containing `Generated below - DO NOT EDIT`.

Example:

```ts
import type {APIResponse, Pokemon} from "./types";

type ConcreteGenerics = [
  APIResponse<Pokemon>
];

/**
 * Generated below - DO NOT EDIT
 */
```

### Generic naming

For concrete generic types, function names are built from generic arguments in order, followed by the base type:

- `B<A>` -> `generateAB`
- `A<B, C, D>` -> `generateBCDA`

## Development

```bash
npm run build
npm run typecheck
```
