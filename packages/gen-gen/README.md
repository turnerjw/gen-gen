# gen-gen

Generate Faker-based test data factories from your TypeScript types. You write the types, gen-gen writes the boilerplate.

gen-gen is a **code generator**, not a runtime library. It reads your TypeScript source at build time and writes plain functions into your codebase. There's no runtime dependency, no special test harness, no reflection. The generated code is regular TypeScript that you can read, debug, and version control.

## Why gen-gen?

Every time you add a field to a type, you update every test fixture that uses it. If `User` gains a `preferences` object, you might touch 30 test files -- not because the tests care about preferences, but because TypeScript demands a complete object.

**Without gen-gen:**

```ts
test("admin users see the settings link", () => {
  const user: User = {
    id: "user-2",
    name: "Bob",
    email: "bob@example.com",
    role: "admin",
    avatar: "https://example.com/avatar.png",
    preferences: { theme: "dark", locale: "en-US" },
    createdAt: "2024-01-01T00:00:00Z",
  };
  expect(hasSettingsLink(user)).toBe(true);
});
```

**With gen-gen:**

```ts
test("admin users see the settings link", () => {
  const user = generateUser({ role: "admin" });
  expect(hasSettingsLink(user)).toBe(true);
});
```

Add `bio: string` to `User`. Re-run `npx gen-gen`. Zero test changes. Each test declares only the fields it cares about.

## Install

```bash
npm install --save-dev @trnr/gen-gen @faker-js/faker
```

`typescript` (^5.9.3) is a peer dependency and must be installed in your project.

## Getting started

### 1. Define your types

```ts
// src/types.ts
export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
};
```

### 2. Create your generator file

Create a `data-gen.ts` file that imports the types you want generators for. Use **type-only imports** to tell gen-gen which types to target.

```ts
// src/data-gen.ts
import type { User } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
```

The marker comment is required. gen-gen writes all generated code below it.

### 3. Run gen-gen

```bash
npx gen-gen --input src/data-gen.ts
```

gen-gen reads the type imports, generates a `generateUser` function, and writes it into your `data-gen.ts` file.

### 4. Use it in a test

```ts
import { generateUser } from "./data-gen";

test("displays the user name", () => {
  const user = generateUser();
  // user has all fields filled with random data
  expect(renderName(user)).toBeTruthy();
});
```

### 5. Override only what matters

Pass overrides as a partial object. Everything else stays random.

```ts
test("admin users see the settings link", () => {
  const admin = generateUser({ role: "admin" });
  expect(admin.role).toBe("admin");
  // name, email, id are all still random
});
```

## Using your generators

### Basic usage

Call the generator with no arguments for a fully random object:

```ts
const user = generateUser();
```

Every call returns fresh random data.

### Partial overrides

Pass a partial object to pin specific fields. Overrides are type-safe -- TypeScript will error if you pass a field that doesn't exist on the type.

```ts
const admin = generateUser({ role: "admin" });
```

### Deep merge

When your type has nested objects, overrides are deep-merged by default. You only need to specify the nested fields you care about.

```ts
const user = generateUserProfile({
  profile: { settings: { theme: "dark" } },
});
// profile.settings.theme is "dark"
// profile.settings.locale is still random
// profile.name is still random
```

Deep merge is enabled by default and can be disabled with `GenGenConfig` (see [Configuration](#gengenconfig)).

### Callback overrides with nested helpers

For more control over nested objects, pass a callback instead of a plain object. The callback receives typed helper functions for each nested object property.

```ts
const draft = generateCheckoutDraft((helpers) => ({
  shipping: {
    address: helpers.generateAddress({ city: "Portland" }),
    instructions: "Leave at door",
  },
}));
```

For array items with object elements, you also get `generate{PropertyName}Item` and `generate{PropertyName}Items`:

```ts
const draft = generateCheckoutDraft((helpers) => ({
  items: [
    helpers.generateItemsItem({ quantity: 3 }),
    helpers.generateItemsItem({ quantity: 1 }),
  ],
}));
```

### Union types

gen-gen handles union types automatically:

- **String/numeric literal unions** (`"idle" | "loading" | "error"`) -- picks a random member
- **Discriminated unions** (`{ kind: "user"; ... } | { kind: "order"; ... }`) -- picks a random variant
- **Nullable types** (`string | null`) -- randomly chooses between the value and `null`

To pin a specific variant, just override:

```ts
const example = generateApiResponse({ status: "error" });
```

## CLI

```bash
gen-gen [options]
```

| Flag | Short | Description |
|---|---|---|
| `--input <path>` | `-i` | Path to the generator source file. Default: `data-gen.ts` |
| `--cwd <path>` | | Working directory used to resolve `--input` |
| `--check` | | Exit with code 1 if the generated section is out of date. Does not write. |
| `--dry-run` | | Print the resulting file content to stdout without writing. |
| `--fail-on-warn` | | Exit with an error if generation produces any warnings. |
| `--watch` | `-w` | Watch for file changes and regenerate automatically. |
| `--help` | `-h` | Show the help message. |

### Examples

```bash
# Single run
npx gen-gen --input src/data-gen.ts

# CI freshness check
npx gen-gen --input src/data-gen.ts --check --fail-on-warn

# Preview without writing
npx gen-gen --input src/data-gen.ts --dry-run

# Watch mode
npx gen-gen --input src/data-gen.ts --watch
```

## Vite plugin

```ts
import { defineConfig } from "vite";
import { genGenPlugin } from "@trnr/gen-gen/vite";

export default defineConfig({
  plugins: [
    genGenPlugin({
      input: "src/data-gen.ts",
      failOnWarn: true,
    }),
  ],
});
```

The plugin runs gen-gen during `vite dev` and `vite build`, and watches for type changes during development.

## Programmatic API

```ts
import { generateDataFile } from "@trnr/gen-gen";

const result = await generateDataFile({
  input: "src/data-gen.ts",
  cwd: process.cwd(),
  write: true,
  failOnWarn: false,
});

result.changed;      // whether the file was modified
result.warnings;     // any warnings emitted
result.content;      // the full file content
result.watchedFiles; // files that should trigger regeneration
```

### GenerateOptions

| Option | Type | Default | Description |
|---|---|---|---|
| `input` | `string` | `"data-gen.ts"` | Path to the generator source file |
| `cwd` | `string` | `process.cwd()` | Working directory to resolve input from |
| `write` | `boolean` | `true` | Whether to write the result back to the file |
| `failOnWarn` | `boolean` | `false` | Exit with error if generation emits warnings |
| `languageService` | `ts.LanguageService` | -- | Reuse a TypeScript LanguageService for watch scenarios |

## Configuration

gen-gen is configured entirely inside your `data-gen.ts` file. There are no separate config files.

### Faker overrides

Override the default Faker expression for specific properties:

```ts
const FakerOverrides: TypedFakerOverrides = {
  "User.id": () => faker.string.uuid(),
  "User.createdAt": () => faker.date.recent().toISOString(),
  email: () => faker.internet.email(),
};
```

`TypedFakerOverrides` is emitted into your file by gen-gen and provides autocomplete for valid override keys.

#### Key matching priority

1. `TypeName.property.nested.path` -- full path from root type
2. `property.nested.path` -- path without the type prefix
3. `propertyName` -- just the leaf property name
4. Declared type text (the literal type annotation)
5. Type alias name
6. Resolved type text

All matching is case-insensitive and whitespace is stripped.

#### Value formats

- **Arrow functions (no params)** -- body is inlined: `"User.id": () => faker.string.uuid()`
- **Arrow functions (with `faker` param)** -- called with faker instance: `"User.id": (faker) => faker.string.uuid()`
- **Property access** -- called automatically: `"User.id": faker.string.uuid`
- **String expressions** -- inserted as raw code: `"User.age": "42"`

### Faker strategies

For project-wide conventions, define a `FakerStrategy` function. It runs as a fallback for every property without a direct `FakerOverrides` match.

```ts
const FakerStrategy = (context: FakerStrategyContext): FakerStrategyResult | undefined => {
  if (context.propertyName === "email") {
    return { expression: "faker.internet.email()", invokeMode: "raw" };
  }
  if (context.propertyName === "id" && context.typeText === "string") {
    return { expression: "faker.string.uuid()", invokeMode: "raw" };
  }
  return undefined;
};
```

Priority order: `FakerOverrides` > `FakerStrategy` > built-in type defaults.

### GenGenConfig

```ts
import type { GenGenConfigOptions } from "@trnr/gen-gen";

const GenGenConfig: GenGenConfigOptions = {
  deepMerge: true,
  optionalProperties: "include",
  indexSignatures: "ignore",
};
```

| Option | Values | Default | Description |
|---|---|---|---|
| `deepMerge` | `true` / `false` | `true` | Merge overrides recursively instead of shallow spread |
| `optionalProperties` | `"include"` / `"omit"` | `"include"` | Include or omit optional properties in generated objects |
| `indexSignatures` | `"ignore"` / `"warn"` | `"ignore"` | Warn when index signatures are present but not materialized |

### Type filters

```ts
// Only generate for these types
type IncludeGenerators = [Account, Session];

// Exclude specific types
type ExcludeGenerators = [InternalType];
```

### Concrete generics

Generic types need concrete type arguments:

```ts
type ConcreteGenerics = [
  ApiEnvelope<UserSummary>,
  Connection<UserSummary>,
];
```

This generates `generateUserSummaryApiEnvelope` and `generateUserSummaryConnection`.

### @gen-gen-ignore

Skip an entire type or a specific property:

```ts
/** @gen-gen-ignore */
export type InternalOnly = { token: string };

export type Account = {
  id: string;
  /** @gen-gen-ignore */
  profile: { locale: string; timezone: string };
  email: string;
};
```

## Type handling

- **Literal unions** (`"a" | "b"`, `1 | 2 | 3`) -- `faker.helpers.arrayElement(...)`
- **Boolean literal unions** (`true | false`) -- `faker.datatype.boolean()`
- **Object unions** (including discriminated) -- generates one branch, selects via `faker.helpers.arrayElement(...)`
- **Mixed unions** (`string | number | { ... }`) -- samples across all concrete members
- **Enums** -- generated from declared member values, cast to enum type
- **Branded/opaque primitives** (`string & { __brand: "X" }`) -- faker primitive value cast to alias type

## Troubleshooting

### `Skipped imported type "X": generic type requires ConcreteGenerics entry`

Import a generic type like `ApiEnvelope<T>` needs a concrete instantiation:

```ts
type ConcreteGenerics = [ApiEnvelope<User>];
```

### `Unused faker overrides: X`

A key in `FakerOverrides` didn't match any property. Check for typos or renamed types.

### `Ignored FakerOverrides: expected an object literal`

`FakerOverrides` must be an inline object literal. It can't be a reference to another variable.

### Debug workflow

1. **Preview output** -- `--dry-run` to inspect without writing
2. **CI checks** -- `--check --fail-on-warn` to catch stale generators
3. **Watch diagnostics** -- `GEN_GEN_WATCH_DIAGNOSTICS=1` to see what triggered regeneration

## License

MIT
