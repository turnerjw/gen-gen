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

Generated functions accept either:

- `Partial<T>` overrides, or
- a callback that receives nested generator helpers and returns `Partial<T>`.

Example:

```ts
const data = generateUnnamedNestedExample(({generateB}) => ({
  a: "Test",
  b: generateB({d: true}),
}));
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
- `--deep-merge`: merge overrides deeply instead of shallow spread

### Deep Merge Behavior

By default, generated functions merge overrides with a shallow spread.

Default (shallow):

```ts
return {
  ...base,
  ...overrides,
};
```

With `--deep-merge` (or plugin `deepMerge: true`), nested objects are merged recursively.

Deep merge:

```ts
return mergeDeep(base, overrides);
```

Example with nested data:

```ts
type User = {
  profile: {
    name: string;
    settings: {
      theme: string;
      locale: string;
    };
  };
};
```

If you pass:

```ts
generateUser({
  profile: {
    settings: {
      theme: "dark",
    },
  },
});
```

- Shallow merge: `profile` is replaced by your override object (you may lose `profile.name` and `settings.locale` unless you provide them).
- Deep merge: only `settings.theme` is replaced; other nested fields from generated defaults are preserved.

When to enable deep merge:

- You usually override nested fields via object literals.
- You want partial nested overrides to preserve sibling defaults automatically.
- Your test code prefers concise object overrides over helper callbacks.

When to keep default shallow merge:

- You want explicit replacement semantics at each top-level field.
- You rely on full object replacement to avoid accidentally keeping stale nested defaults.
- Your team already uses callback helpers for nested customization (`generateX(({generateY}) => ...)`).

## Vite plugin

```ts
import {defineConfig} from "vite";
import {genGenPlugin} from "gen-gen";

export default defineConfig({
  plugins: [genGenPlugin({input: "data-gen.ts", deepMerge: true})],
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
