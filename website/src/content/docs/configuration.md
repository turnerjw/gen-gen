---
title: Configuration
summary: All in-file configuration options for gen-gen including faker overrides, faker strategies, GenGenConfig, and type filters.
keywords: [config, faker overrides, faker strategy, deepMerge, optionalProperties, indexSignatures, include, exclude]
---

gen-gen is configured entirely inside your `data-gen.ts` file. There are no separate config files. Every option below is a specially-named variable or type alias that gen-gen reads at generation time.

## Faker overrides

Override the default Faker expression for specific properties by declaring a `FakerOverrides` variable. Keys are dot-separated paths that match properties during generation.

gen-gen emits a `TypedFakerOverrides` type into your file that provides autocomplete for valid override keys. You should always type your `FakerOverrides` variable with it:

```ts
const FakerOverrides: TypedFakerOverrides = {
  "User.id": () => faker.string.uuid(),
  "User.createdAt": () => faker.date.recent().toISOString(),
  email: () => faker.internet.email(),
};
```

### Key matching

Keys are matched in priority order (first match wins):

1. `TypeName.property.nested.path` -- full path from root type
2. `property.nested.path` -- path without the type prefix
3. `propertyName` -- just the leaf property name
4. Declared type text (the literal type annotation on the property)
5. Type alias name (if the type is a named alias)
6. Resolved type text

All matching is **case-insensitive** and whitespace is stripped.

### Value formats

Override values can be:

- **Arrow functions with no parameters** -- the body is inlined directly:
  ```ts
  "User.id": () => faker.string.uuid()
  // Generated: id: faker.string.uuid()
  ```

- **Arrow functions with a `faker` parameter** -- called with the faker instance:
  ```ts
  "User.id": (faker) => faker.string.uuid()
  // Generated: id: ((faker) => faker.string.uuid())(faker)
  ```

- **Property access expressions** -- called automatically:
  ```ts
  "User.id": faker.string.uuid
  // Generated: id: faker.string.uuid()
  ```

- **String expressions** -- inserted as raw code:
  ```ts
  "User.age": "42"
  // Generated: age: 42
  ```

### Unused override warnings

If an override key doesn't match any property during generation, gen-gen emits a warning with a "Did you mean?" suggestion based on the nearest match. Use `--fail-on-warn` in CI to catch stale overrides.

## Faker strategies

For project-wide conventions that go beyond individual property overrides, define a `FakerStrategy` function. It runs as a fallback for every property that doesn't have a direct `FakerOverrides` match.

```ts
const FakerStrategy = (context: FakerStrategyContext): FakerStrategyResult | undefined => {
  // Use semantic faker methods for known patterns
  if (context.propertyName === "email") {
    return { expression: "faker.internet.email()", invokeMode: "raw" };
  }
  if (context.propertyName === "id" && context.typeText === "string") {
    return { expression: "faker.string.uuid()", invokeMode: "raw" };
  }
  // Return undefined to use the default behavior
  return undefined;
};
```

### FakerStrategyContext

The callback receives a context object with these fields:

| Field | Type | Description |
|---|---|---|
| `rootTypeText` | `string` | The name of the root type being generated (e.g., `"User"`) |
| `propertyPath` | `string[]` | Full path from root (e.g., `["profile", "settings", "theme"]`) |
| `propertyName` | `string \| undefined` | The leaf property name (e.g., `"theme"`) |
| `path` | `string` | Dot-joined path (e.g., `"profile.settings.theme"`) |
| `typeText` | `string` | Resolved TypeScript type text (e.g., `"string"`) |
| `aliasTypeText` | `string \| undefined` | The type alias name if one exists (e.g., `"UserId"`) |
| `declaredTypeText` | `string \| undefined` | The literal type annotation text from source |

### FakerStrategyResult

Return one of:

- `undefined` -- skip, use default behavior
- A string expression (inserted as raw code)
- An arrow function (same semantics as FakerOverrides values)
- An object with `{ expression: string; invokeMode?: "raw" | "call" | "callWithFaker" }`

### Priority order

`FakerOverrides` always takes priority over `FakerStrategy`. The full resolution order is:

1. Direct `FakerOverrides` match
2. `FakerStrategy` return value
3. Built-in type defaults (e.g., `faker.word.noun()` for strings)

## GenGenConfig

Control generator behavior with a `GenGenConfig` variable:

```ts
const GenGenConfig = {
  deepMerge: true,
  optionalProperties: "include",
  indexSignatures: "ignore",
} as const;
```

### Options

| Option | Values | Default | Description |
|---|---|---|---|
| `deepMerge` | `true` / `false` | `true` | When `true`, overrides are deep-merged into the base object. When `false`, overrides use shallow spread (`{ ...base, ...overrides }`). |
| `optionalProperties` | `"include"` / `"omit"` | `"include"` | When `"include"`, optional properties are generated with a random choice between the value and `undefined`. When `"omit"`, optional properties are skipped entirely. |
| `indexSignatures` | `"ignore"` / `"warn"` | `"ignore"` | Index signatures (`[key: string]: T`) can't be materialized. `"ignore"` silently skips them. `"warn"` emits a warning for each one. |

### Deep merge behavior

With `deepMerge: true` (the default), you can override deeply nested fields without replacing the entire parent:

```ts
const user = generateUser({ profile: { settings: { theme: "dark" } } });
// profile.name and profile.settings.locale are preserved
```

With `deepMerge: false`, overrides use a shallow spread at each level:

```ts
const user = generateUser({ profile: { settings: { theme: "dark" } } });
// profile completely replaces the generated profile
// profile.name is gone, profile.settings.locale is gone
```

## IncludeGenerators / ExcludeGenerators

Filter which types get generators using tuple type aliases:

```ts
// Only generate for Account and Session (ignore other imported types)
type IncludeGenerators = [Account, Session];

// Exclude specific types
type ExcludeGenerators = [InternalType];
```

When `IncludeGenerators` is present, only listed types get generators. `ExcludeGenerators` removes types even if they appear in `IncludeGenerators`. Both support concrete generic types like `Envelope<Session>`.

Unmatched filter entries produce warnings. Use `--fail-on-warn` to catch stale filters in CI.

## ConcreteGenerics

Generic types can't be generated directly -- gen-gen needs concrete type arguments. List concrete instantiations in a `ConcreteGenerics` tuple:

```ts
type ConcreteGenerics = [
  ApiEnvelope<UserSummary>,
  Connection<UserSummary>,
];
```

This generates `generateUserSummaryApiEnvelope` and `generateUserSummaryConnection`. The function name is derived from the type arguments and the generic type name.

## @gen-gen-ignore

Add a `@gen-gen-ignore` JSDoc tag to skip an entire type or a specific property during generation.

On a type -- gen-gen skips the type entirely:

```ts
/** @gen-gen-ignore */
export type InternalOnly = {
  token: string;
};
```

On a property -- gen-gen emits an empty cast (`{} as T`) for that property:

```ts
export type Account = {
  id: string;
  /** @gen-gen-ignore */
  profile: {
    locale: string;
    timezone: string;
  };
  email: string;
};
```

The generated `generateAccount` will have `profile: {} as { locale: string; timezone: string }` -- you can override it in tests when needed.
