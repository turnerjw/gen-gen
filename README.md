# gen-gen

`gen-gen` generates Faker-based test data factories from imported TypeScript types.

## Project Status

Track implemented and planned features in [PROGRESS.md](./PROGRESS.md).

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

Helper callbacks include object field helpers (for example `generateProfile`) and object-array item helpers (for example `generateItemsItem`).

Example:

```ts
const data = generateUnnamedNestedExample(({generateB}) => ({
  a: "Test",
  b: generateB({d: true}),
}));
```

Union handling notes:

- Literal unions (like `"a" | "b"` or `1 | 2 | 3`) are generated via `faker.helpers.arrayElement(...)`.
- Boolean literal unions (`true | false`) use `faker.datatype.boolean()`.
- Object unions (including discriminated unions) generate one branch and select via `faker.helpers.arrayElement(...)`.
- Mixed unions (for example `string | number | { ... }`) sample across all concrete members.
- Enums are generated from declared enum member values (string and numeric), then cast to the enum type.

## Install

```bash
npm install -D gen-gen typescript @faker-js/faker
```

## CLI

```bash
gen-gen --input example/basic/data-gen.ts
```

Options:

- `-i, --input <path>`: input file (default `data-gen.ts`)
- `--cwd <path>`: working directory to resolve `--input`
- `--check`: exits with code `1` if the generated section is stale
- `--dry-run`: print resulting file contents instead of writing
- `--fail-on-warn`: fail generation when warnings are emitted
- `-w, --watch`: run continuously and regenerate on changes

### Deep Merge Behavior

Deep merge can be enabled via in-file `GenGenConfig` (see [In-file configuration](#in-file-configuration)).

By default, generated functions merge overrides with a shallow spread.

Default (shallow):

```ts
return {
  ...base,
  ...overrides,
};
```

With `deepMerge: true`, nested objects are merged recursively.

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

### Property Policy

Property policy options can be configured via in-file `GenGenConfig` (see [In-file configuration](#in-file-configuration)).

Available policies:

- `optionalProperties: "include" | "omit"` — include or omit optional properties in generated base objects (default: `"include"`)
- `indexSignatures: "ignore" | "warn"` — ignore or warn when index signatures are not materialized (default: `"ignore"`)

Behavior notes:

- `optionalProperties: "omit"` skips optional fields in generated base objects.
- `indexSignatures: "warn"` emits warnings when index signatures are present but not materialized into generated keys.

### Branded/Opaque Primitive Aliases

Branded/opaque primitive intersections are generated as primitive faker values with a cast back to the alias type.

Example:

```ts
type UserId = string & { readonly __brand: "UserId" };
type AmountCents = number & { readonly __brand: "AmountCents" };
```

Generated values are emitted like:

```ts
id: faker.word.noun() as UserId
total: faker.number.int({ min: 1, max: 1000 }) as AmountCents
```

If you need specific value formats for branded fields (for example UUID-like `UserId`), use `FakerOverrides` by type or path key.

### Enum Strategy

For enum-typed fields, `gen-gen` reads declared enum member values and generates from that explicit set.

Example:

```ts
enum Status {
  Draft = "draft",
  Active = "active",
  Closed = "closed",
}
```

Generated expression:

```ts
status: faker.helpers.arrayElement(["draft", "active", "closed"]) as Status
```

## Vite plugin

```ts
import {defineConfig} from "vite";
import {genGenPlugin} from "gen-gen";

export default defineConfig({
  plugins: [
    genGenPlugin({
      input: "data-gen.ts",
      failOnWarn: true,
    }),
  ],
});
```

The plugin runs generation during build/dev startup and watches relevant source files.

## Input file shape

The input file should:

1. Import the types you want factories for.
2. Optionally define `type ConcreteGenerics = [...]` to specify concrete generic instantiations.
3. Optionally define `type IncludeGenerators = [...]` / `type ExcludeGenerators = [...]` to filter generated targets.
4. Optionally define `const FakerOverrides = { ... }` for per-field/per-type faker expressions.
5. Optionally define `const GenGenConfig = { ... }` for generation options (deep merge, property policies).
6. Optionally add `@gen-gen-ignore` on types/properties to skip generation behavior.
7. Include a marker comment containing `Generated below - DO NOT EDIT`.

Example:

```ts
import type {APIResponse, Pokemon} from "./types";

type ConcreteGenerics = [
  APIResponse<Pokemon>
];

type IncludeGenerators = [
  Pokemon,
  APIResponse<Pokemon>
];

type ExcludeGenerators = [
  APIResponse<Pokemon>
];

const FakerOverrides = {
  email: () => faker.internet.email(),
  "Pokemon.id": () => faker.number.int({ min: 10000, max: 99999 }),
  "APIResponse<Pokemon>": () => ({ data: generatePokemon(), error: undefined }),
} as const;

/** @gen-gen-ignore */
type InternalOnly = {
  token: string;
};

type Account = {
  id: string;
  /** @gen-gen-ignore */
  profile: {
    locale: string;
  };
};

/**
 * Generated below - DO NOT EDIT
 */
```

`@gen-gen-ignore` behavior:

- On a type/interface/class declaration: skip generating that root generator.
- On a property: skip faker generation for that field and emit a typed placeholder value.

Filter matching accepts type text and generator names. For example, `IncludeGenerators` or `ExcludeGenerators` can reference types like `Pokemon` or generator names like `generateParty`.

If a configured include/exclude filter does not match any generation target, `gen-gen` emits a warning.

Use function values in `FakerOverrides` for type-safe expressions.

Faker override keys are matched in this order:

1. `<RootType>.<path.to.field>` (for example `Pokemon.id`)
2. `path.to.field` (for example `profile.locale`)
3. final property name (for example `email`)
4. type text (for example `APIResponse<Pokemon>`)

Unused faker override keys also emit warnings, which helps catch typos in override paths.

### In-file configuration

Use `const GenGenConfig = { ... } as const` in your input file to configure generation behavior:

```ts
const GenGenConfig = {
  deepMerge: true,
  optionalProperties: "omit",
  indexSignatures: "warn",
} as const;
```

Available options:

- `deepMerge` (boolean): merge overrides deeply instead of shallow spread (default: `false`)
- `optionalProperties` (`"include"` | `"omit"`): include or omit optional properties (default: `"include"`)
- `indexSignatures` (`"ignore"` | `"warn"`): behavior for index signatures (default: `"ignore"`)

### Generic naming

For concrete generic types, function names are built from generic arguments in order, followed by the base type:

- `B<A>` -> `generateAB`
- `A<B, C, D>` -> `generateBCDA`

## API

```ts
import {generateDataFile} from "gen-gen";

const result = await generateDataFile({
  input: "data-gen.ts",
  cwd: process.cwd(),
  write: true,
  failOnWarn: false,
});

console.log(result.changed);      // whether the file was modified
console.log(result.warnings);     // any warnings emitted
console.log(result.content);      // the full file content
console.log(result.watchedFiles); // files that should trigger regeneration
```

## Development

```bash
bun run build
bun run typecheck
bun test
```
