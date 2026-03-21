# gen-gen Audit — Execution Plan

## Background

Full audit of the gen-gen library. Issues identified:

1. Config drift: project-level options exist in both the data-gen file AND the API/plugin/CLI
2. Missing declarative surfaces: `fakerStrategy`, `propertyPolicy`, `deepMerge` unreachable from data-gen file
3. Unnecessary features: `readonlyProperties: "warn"`, `typeMappingPresets`, `markerText`, `watchDiagnostics`
4. API ergonomics: no type-safe override keys, no function-reference shorthand, no array count helper
5. Bugs: block-body zero-arg arrow functions in FakerOverrides behave differently from expression-body ones
6. Deep merge should always be on (or default true); no good reason to use shallow

---

## Dependency Graph

```
Batch A (fully independent — run all in parallel)
├── T1:    Remove readonlyProperties option
├── T2T3:  Remove markerText + move watchDiagnostics to env var
├── T4T5:  FakerOverrides improvements (bugfix + shorthand syntax)
├── T6:    Export GenGenConfigOptions static type
├── T7:    Make deepMerge default true
├── T8:    Plural array helpers in callbacks
├── T9:    Improve unused override warning messages
└── T14:   Generate FakerOverridePaths + TypedFakerOverrides types

Batch B (after Batch A, independent of each other)
├── T10:   Add GenGenConfig parsing in data-gen file
└── T11:   Add FakerStrategy parsing in data-gen file

Batch C (after Batch B)
├── T12:   Strip project-specific options from API/CLI  ← needs T10 + T11
└── T13:   Remove typeMappingPresets                    ← needs T11
```

All PRs target `main`. Each task gets its own worktree and changeset.

---

## Tasks

### T1 — Remove `readonlyProperties` option

**What:** The `"warn"` value adds no value for test data (readonly is TypeScript-only). Remove the option entirely; always include readonly fields silently.

**Files:** `src/generator.ts`, `src/cli-core.ts`, `src/cli.ts`, `src/vite-plugin.ts`

**Changes:**
- Remove `readonlyProperties` from `PropertyPolicy` interface → collapse to just `optionalProperties` and `indexSignatures`
- Remove CLI flag `--readonly-properties` and related parsing
- Remove from `GenGenPluginOptions`, `CliOptions`, `GenerateOptions`
- Remove from `resolvePropertyPolicy` and `DEFAULT_PROPERTY_POLICY`
- Remove any generator code that checks `policy.readonlyProperties`
- Update tests in `test/generator.test.ts`, `test/cli-core.test.ts`

**Changeset:** `patch` — "Remove readonlyProperties policy option; readonly fields are always included silently"

---

### T2T3 — Remove `markerText` option + move `watchDiagnostics` to env var

**T2 — markerText:** The default marker `"Generated below - DO NOT EDIT"` is universally fine. Customizing it adds dead API surface.

**Files:** `src/generator.ts`, `src/vite-plugin.ts`

**Changes:**
- Remove `markerText` from `GenerateOptions` and `GenGenPluginOptions`
- Inline `DEFAULT_MARKER_TEXT` constant directly in `generateDataFile`
- Update tests

**T3 — watchDiagnostics:** Internal dev tool for timing watch cycles — shouldn't be a public API option.

**Files:** `src/vite-plugin.ts`, `src/cli-core.ts`, `src/cli.ts`

**Changes:**
- Remove `watchDiagnostics` from `GenGenPluginOptions` and `CliOptions`
- Read from `process.env.GEN_GEN_WATCH_DIAGNOSTICS === "1"` instead
- Update tests

**Changeset:** `patch` — "Remove markerText option and move watchDiagnostics to GEN_GEN_WATCH_DIAGNOSTICS env var"

---

### T4T5 — FakerOverrides improvements (bugfix + shorthand syntax)

**T4 — bugfix:** Zero-arg block-body arrow functions in FakerOverrides don't get body extraction, while expression-body ones do. `() => { return faker.internet.email(); }` stays as "call" mode while `() => faker.internet.email()` becomes "raw". Fix: also extract block-body single-return zero-arg arrows.

**T5 — shorthand:** Allow bare function references as FakerOverrides values. `email: faker.internet.email` should emit `faker.internet.email()`. Currently falls through to raw mode emitting without calling (latent bug).

**Files:** `src/generator.ts` — `extractFunctionOverrideSpec` function (lines ~427–474)

**Changes for T4:** In the `isArrowFunction` branch with `parameters.length === 0`, when the body is a `Block` with a single return statement, extract its expression with `invokeMode: "raw"`.

**Changes for T5:** Add before the final `return null`:
```ts
if (ts.isPropertyAccessExpression(expression) || ts.isElementAccessExpression(expression)) {
  return {
    expression: `${expression.getText(sourceFile)}()`,
    invokeMode: "raw",
  };
}
```

**Tests:** Add fixture tests for both cases in `test/generator.test.ts`.

**Changeset:** `minor` — "Support bare function references in FakerOverrides (e.g. `email: faker.internet.email`); fix block-body zero-arg arrow function handling"

---

### T6 — Export `GenGenConfigOptions` static type

**What:** Export a static type for the `GenGenConfig` const users will add to their data-gen file. Also export `FakerStrategyContext` and `FakerStrategyResult` for annotating a `FakerStrategy` const.

**Files:** `src/generator.ts`, `src/index.ts`

**Changes:**
```ts
// src/generator.ts — add:
export interface GenGenConfigOptions {
  deepMerge?: boolean;
  optionalProperties?: "include" | "omit";
  indexSignatures?: "ignore" | "warn";
}

// src/index.ts — add re-exports:
export type { GenGenConfigOptions, FakerStrategyContext, FakerStrategyResult } from "./generator.js";
```

Note: `FakerStrategyContext` and `FakerStrategyResult` are already defined in `generator.ts` but may need `export` added.

**Changeset:** `minor` — "Export GenGenConfigOptions, FakerStrategyContext, and FakerStrategyResult types for data-gen file annotations"

---

### T7 — Make `deepMerge` default `true`

**What:** No good reason to default to shallow merge. The `Object.assign` footgun drops sibling fields on nested overrides. When you need explicit replacement, callbacks handle it.

**Files:** `src/generator.ts`, `src/cli-core.ts`

**Changes:**
- `generateDataFile`: change `options.deepMerge ?? false` → `options.deepMerge ?? true`
- `parseArgs`: change `deepMerge: false` → `deepMerge: true` in default options
- Update tests that rely on the old shallow-merge default

**Changeset:** `major` — "Deep merge is now the default; pass deepMerge: false to opt out"

---

### T8 — Plural array helpers in callbacks

**What:** Add `generateXxxItems(count, overrides?)` alongside existing `generateXxxItem(overrides?)`. Closes the gap between "fully specify an array" and "random-length array" — enables "N default items."

**Files:** `src/generator.ts` — code emission for `GenGenHelpers` type and `__genGenCreateHelper`

**Changes:**
- In `GenGenHelpers<T>` generated type, add plural form for each array-item key:
  ```ts
  generateItemsItem: (overrides?: ...) => Item      // existing
  generateItemsItems: (count: number, overrides?: ...) => Item[]  // new
  ```
- Emit the plural helper function in the runtime helper factory:
  ```ts
  generateItemsItems: (count: number, overrides?) =>
    Array.from({ length: count }, () => generateItemsItem(overrides))
  ```

**Tests:** Add fixture tests demonstrating `generateXxxItems(n)` in callback.

**Changeset:** `minor` — "Add plural array helpers to callback API: generateXxxItems(count, overrides?)"

---

### T9 — Improve unused override warning messages

**What:** "Faker override key 'X' was not used" doesn't help the developer fix the issue. Add nearest-match suggestions.

**Files:** `src/generator.ts` — `collectUnusedFakerOverrideWarnings` function

**Changes:**
- Pass the set of all matched override paths through to the warning collector
- For each unused key, find the closest match (substring or Levenshtein distance)
- Update warning format: `"Faker override key 'User.emial' was not used. Did you mean 'User.email'?"`

**Changeset:** `patch` — "Improve unused FakerOverride key warnings with nearest-match suggestions"

---

### T10 — Add `GenGenConfig` parsing in data-gen file

**What:** Allow `const GenGenConfig = { ... } as const` in the data-gen file to control `deepMerge`, `optionalProperties`, `indexSignatures`. Moves project config into the data-gen file.

**Files:** `src/generator.ts`

**Changes:**
- Add `collectGenGenConfig(sourceFile): Partial<GenGenConfig>` function (pattern: find `VariableDeclaration` named `GenGenConfig`, unwrap `as const`, extract object literal properties as string/boolean values)
- Call in `parseTargets`, return alongside other parsed values
- In `generateDataFile`, merge: data-gen file config is the base, API-level options override (for CI use)

**Tests:** Add fixture tests with `GenGenConfig` const and verify it changes generation behavior.

**Changeset:** `minor` — "Add GenGenConfig declarative config in data-gen file (deepMerge, optionalProperties, indexSignatures)"

---

### T11 — Add `FakerStrategy` parsing in data-gen file

**What:** Allow `const FakerStrategy = (ctx) => { ... }` in the data-gen file, making the strategy hook accessible without the programmatic API.

**Files:** `src/generator.ts`

**Changes:**
- Add `collectFakerStrategy(sourceFile): FakerStrategyHook | undefined` function (find `VariableDeclaration` or `FunctionDeclaration` named `FakerStrategy`, extract function body text, eval it to get a callable hook)
- In `parseTargets`, return the extracted strategy
- In `generateDataFile`, merge with API-level `fakerStrategy` (API takes precedence)
- The `FakerStrategyContext` type should already be importable from gen-gen (T6)

**Tests:** Add fixture tests with `FakerStrategy` const and verify it affects generated expressions.

**Changeset:** `minor` — "Add FakerStrategy declarative config in data-gen file"

---

### T12 — Strip project-specific options from API/CLI

**What:** After T10 + T11 land, all project config is in the data-gen file. Remove it from the programmatic API surface.

**Prerequisite:** T10 and T11 merged

**Files:** `src/generator.ts`, `src/cli-core.ts`, `src/cli.ts`, `src/vite-plugin.ts`

**Remove from API/CLI:**
- `deepMerge` → GenGenConfig
- `propertyPolicy` → GenGenConfig
- `fakerStrategy` → FakerStrategy const in data-gen file
- `fakerOverrides` → FakerOverrides const in data-gen file
- `include` / `exclude` → IncludeGenerators / ExcludeGenerators in data-gen file

**Keep (operational only):** `input`, `cwd`, `write`, `failOnWarn`, `watch`, `check`, `dryRun`

**Changeset:** `major` — "Remove project-specific options from API/CLI; all project config now lives in the data-gen file"

---

### T13 — Remove `typeMappingPresets`

**What:** Opaque built-in strategy rules. With declarative `FakerStrategy` available, they're unnecessary.

**Prerequisite:** T11 merged

**Files:** `src/generator.ts`, `src/cli-core.ts`, `src/cli.ts`, `src/vite-plugin.ts`

**Changes:**
- Remove `TypeMappingPresetName` type and all preset resolution/matching logic
- Remove `--preset` CLI flag
- Remove from all option interfaces
- Update tests

**Changeset:** `major` — "Remove typeMappingPresets; use FakerStrategy in your data-gen file instead"

---

### T14 — Generate `FakerOverridePaths` and `TypedFakerOverrides` types

**What:** Generate a union type of all valid `RootType.property.path` keys plus a typed FakerOverrides map. Enables type-safe override keys with IDE autocomplete.

**Files:** `src/generator.ts` — `emitFunctions` and property traversal

**Changes:**
- Collect all `"TypeName.prop.nested"` path strings during property traversal
- Emit at top of generated section:
  ```ts
  export type FakerOverridePaths =
    | "User.id"
    | "User.email"
    | "User.profile.name"
    // ...

  export type TypedFakerOverrides = {
    [K in FakerOverridePaths | (string & {})]?: (...args: any[]) => unknown | string;
  };
  ```
- Wide value type (`(...args: any[]) => unknown | string`) accepts both arrow functions and bare references (`faker.internet.email`)

**Tests:** Add fixture tests verifying the generated union and map types are correct.

**Changeset:** `minor` — "Generate FakerOverridePaths and TypedFakerOverrides utility types for type-safe override keys"

---

## Verification (all tasks)

```bash
bun run typecheck     # TypeScript strict check
bun test              # Full test suite
bun run gen:example   # Validate CLI with all examples
bun run build         # Ensure dist/ builds clean
```
