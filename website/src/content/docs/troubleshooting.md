---
title: Troubleshooting
summary: Common warnings, errors, and their fixes.
keywords: [errors, warnings, diagnostics, fixes]
---

## CLI errors

### `Unknown argument: <flag>`

You passed a flag that doesn't exist. gen-gen only accepts 7 flags: `--input`, `--cwd`, `--check`, `--dry-run`, `--fail-on-warn`, `--watch`, and `--help`. All other configuration lives inside your data-gen file. See [Configuration](/docs/configuration).

### `--watch cannot be combined with --check or --dry-run`

Watch mode continuously writes changes. It can't also check without writing or print to stdout. Run these modes separately.

### `Unable to load source file: <path>`

The input file doesn't exist at the resolved path. Check your `--input` and `--cwd` flags.

## Generation warnings

### `Skipped imported type "X": generic type requires ConcreteGenerics entry`

You imported a generic type like `ApiEnvelope<T>` as a type-only import. gen-gen can't generate a function for an open generic. Add a concrete instantiation:

```ts
type ConcreteGenerics = [ApiEnvelope<User>];
```

### `Skipped imported type "X": only object types are supported for generators`

gen-gen can only generate functions for object-like types. Arrays, primitives, and function types aren't supported as root generation targets. If you need to generate an array, wrap it in an object type.

### `Skipped imported type "X": marked with @gen-gen-ignore`

The type has a `/** @gen-gen-ignore */` JSDoc tag. Remove the tag if you want a generator for it.

### `Skipped ConcreteGenerics entry "X": ...`

A type in your `ConcreteGenerics` tuple was skipped. The message suffix tells you why -- either it's marked with `@gen-gen-ignore` or it's not an object type.

### `Unmatched include filters: X, Y` / `Unmatched exclude filters: X, Y`

Your `IncludeGenerators` or `ExcludeGenerators` tuple contains types that don't match any imported type. This usually means the type was renamed or removed. Update your filter to match current types.

### `Unused faker overrides: X`

A key in your `FakerOverrides` object didn't match any property during generation. The warning often includes a "Did you mean?" suggestion. Common causes:

- Typo in the key
- The type or property was renamed
- The type was excluded by filters

### `Ignored FakerOverrides: expected an object literal`

The `FakerOverrides` variable must be assigned an inline object literal (optionally with `as const`). It can't be a reference to another variable or function call.

```ts
// This works
const FakerOverrides = { email: () => faker.internet.email() } as const;

// This doesn't
const overrides = { email: () => faker.internet.email() };
const FakerOverrides = overrides; // won't be parsed
```

### `Ignored FakerOverrides property: only identifier and string-literal keys are supported`

Override keys must be identifiers (`email`) or string literals (`"User.email"`). Computed keys (`[someVar]`) aren't supported.

### `Index signature (X) not materialized at Y`

Index signatures (`[key: string]: T`) can't be generated because gen-gen doesn't know what keys to create. The property is emitted as `{} as T`. Set `indexSignatures: "ignore"` in your `GenGenConfig` to suppress this warning, or keep `"warn"` to track them.

## Debug workflow

1. **Preview output** -- run with `--dry-run` to inspect what gen-gen would write without changing files.

2. **Catch regressions in CI** -- add `--check --fail-on-warn` to your CI pipeline to fail on stale generators or warning regressions.

3. **Watch diagnostics** -- set `GEN_GEN_WATCH_DIAGNOSTICS=1` to see which file triggered regeneration and how long it took.
