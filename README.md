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
- `--optional-properties <include|omit>`: include or omit optional properties in generated base objects
- `--readonly-properties <include|warn>`: include readonly properties and optionally emit warnings
- `--index-signatures <ignore|warn>`: ignore or warn when index signatures are not materialized
- `--preset <name[,name...]>`: enable type-mapping presets (`common`, `commerce`)
- `-w, --watch`: run continuously and regenerate on changes
- `--deep-merge`: merge overrides deeply instead of shallow spread
- `--include`: comma-separated filters to include specific generators/types
- `--exclude`: comma-separated filters to exclude specific generators/types
- `--faker-override`: `key=expression` override for generated values (repeatable, CLI)

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

### Property Policy

Policy options let you control generation behavior for optional properties, readonly properties, and index signatures.

Defaults:

- `optionalProperties: "include"`
- `readonlyProperties: "include"`
- `indexSignatures: "ignore"`

CLI example:

```bash
gen-gen --input data-gen.ts \
  --optional-properties omit \
  --readonly-properties warn \
  --index-signatures warn
```

Plugin example:

```ts
genGenPlugin({
  input: "data-gen.ts",
  propertyPolicy: {
    optionalProperties: "omit",
    readonlyProperties: "warn",
    indexSignatures: "warn",
  },
});
```

Behavior notes:

- `optionalProperties: "omit"` skips optional fields in generated base objects.
- `readonlyProperties: "warn"` still includes readonly fields, but emits warnings.
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
      deepMerge: true,
      include: ["User", "Account"],
      fakerOverrides: {
        email: "faker.internet.email()",
      },
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
5. Optionally add `@gen-gen-ignore` on types/properties to skip generation behavior.
6. Include a marker comment containing `Generated below - DO NOT EDIT`.

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

Filter matching accepts type text and generator names. For example:

- `--include Pokemon,generateParty`
- `--exclude APIResponse<Pokemon>,generatePokemonAPIResponse`

If a configured include/exclude filter does not match any generation target, `gen-gen` emits a warning.

Use function values in `FakerOverrides` (and plugin/API `fakerOverrides`) for type-safe expressions. String values from CLI are still supported for convenience.

For pluggable logic across many fields, use API/plugin `fakerStrategy` (a callback receiving field metadata and returning an override expression).

CLI also supports strategy modules:

```bash
gen-gen --input data-gen.ts --faker-strategy ./faker-strategy.ts
```

The module should export a default function (or named `fakerStrategy`) with the same strategy signature.

Preset example:

```bash
gen-gen --input data-gen.ts --preset common,commerce
```

Preset + strategy can be combined. Strategy still wins over preset matches, and direct `FakerOverrides` win over both.

Faker override keys are matched in this order:

1. `<RootType>.<path.to.field>` (for example `Pokemon.id`)
2. `path.to.field` (for example `profile.locale`)
3. final property name (for example `email`)
4. type text (for example `APIResponse<Pokemon>`)

Unused faker override keys also emit warnings, which helps catch typos in override paths.

`fakerStrategy` runs only when no direct `FakerOverrides` key matched.

Example:

```ts
generateDataFile({
  input: "data-gen.ts",
  fakerStrategy(ctx) {
    if (ctx.rootTypeText === "User" && ctx.path === "id") {
      return {expression: "faker.string.uuid()", invokeMode: "raw"};
    }
    if (ctx.path.endsWith("email")) {
      return (faker) => faker.internet.email();
    }
    return undefined;
  },
});
```

CLI example:

```bash
gen-gen --input data-gen.ts \\
  --faker-override email=faker.internet.email() \\
  --faker-override Pokemon.id=faker.number.int({min:10000,max:99999})
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
