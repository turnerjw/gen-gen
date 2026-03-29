# gen-gen Reference

## data-gen.ts file structure

```ts
import type { User, Order } from "./types";
import { faker } from "@faker-js/faker";

// Optional: concrete instantiations of generic types
type ConcreteGenerics = [APIResponse<User>];

// Optional: filter which types get generators
type IncludeGenerators = [User, Order];
type ExcludeGenerators = [InternalType];

// Optional: customize faker values per field
const FakerOverrides: TypedFakerOverrides = {
  "User.id": () => faker.string.uuid(),
  email: () => faker.internet.email(),
};

// Optional: global fallback for property patterns
const FakerStrategy = (context: FakerStrategyContext): FakerStrategyResult | undefined => {
  if (context.propertyName === "id" && context.typeText === "string") {
    return { expression: "faker.string.uuid()", invokeMode: "raw" };
  }
  return undefined;
};

// Optional: control generation behavior
const GenGenConfig: GenGenConfigOptions = {
  deepMerge: true,
  optionalProperties: "include",
  indexSignatures: "ignore",
};

/**
 * Generated below - DO NOT EDIT
 */
// ... generated code appears here
```

## FakerOverrides

Customize the faker expression for specific properties. Matching priority (first wins):

1. `TypeName.property.nested.path` (e.g., `User.profile.settings.theme`)
2. `property.nested.path` (e.g., `profile.settings.theme`)
3. `propertyName` (e.g., `theme`)
4. Declared type text (e.g., `"string"`)
5. Type alias name (e.g., `UserId`)

Value formats:
- `() => faker.string.uuid()` — arrow function, inlined
- `(faker) => faker.string.uuid()` — called with faker instance
- `faker.string.uuid` — property access, auto-invoked
- `"42"` — string, inserted as raw code

## FakerStrategy

Project-wide fallback function. Receives context about each property:

- `rootTypeText` — name of root type being generated
- `propertyPath` — array from root to this property
- `propertyName` — leaf property name
- `typeText` — resolved TypeScript type
- `aliasTypeText` — type alias name if it exists

Return `{ expression, invokeMode }` or `undefined` to use defaults.

## GenGenConfig options

| Option | Default | Description |
|---|---|---|
| `deepMerge` | `true` | Recursively merge overrides into base objects |
| `optionalProperties` | `"include"` | `"include"` generates values, `"omit"` skips them |
| `indexSignatures` | `"ignore"` | `"ignore"` skips them, `"warn"` emits warnings |

## Type filtering

```ts
// Only generate for these types
type IncludeGenerators = [User, Order];

// Generate for all imported types except these
type ExcludeGenerators = [InternalType];
```

## Generic types

Declare concrete instantiations:

```ts
type ConcreteGenerics = [APIResponse<User>, APIResponse<Order>];
```

Generates `generateUserAPIResponse()`, `generateOrderAPIResponse()`.

## Ignoring types or properties

```ts
/** @gen-gen-ignore */
export type Secret = { token: string };

export type Account = {
  id: string;
  /** @gen-gen-ignore */
  internalMeta: { ... };
};
```

## CLI flags

| Flag | Short | Description |
|---|---|---|
| `--input <path>` | `-i` | Path to data-gen file (default: `data-gen.ts`) |
| `--watch` | `-w` | Watch and regenerate on changes |
| `--check` | | Exit 1 if output is stale (for CI) |
| `--dry-run` | | Print to stdout without writing |
| `--fail-on-warn` | | Exit with error on warnings |
| `--cwd <path>` | | Working directory |

## Vite plugin

```ts
import { genGenPlugin } from "@trnr/gen-gen/vite";

export default defineConfig({
  plugins: [genGenPlugin({ input: "src/data-gen.ts" })],
});
```

Automatically regenerates during `vite dev` and `vite build`.
