# gen-gen Progress Tracker

Last updated: 2026-03-07

## Completed

- CLI generation from input file (`data-gen.ts` default, `--input` override)
- Vite plugin generation support
- `gen:example` script runs with Bun
- CLI watch mode (`--watch`) with regen on dependency changes
- Concrete generic generation via `type ConcreteGenerics = [...]`
- Nested callback overrides for generators
- Nested helper generators (including callback support)
- Optional deep merge mode (`--deep-merge`, plugin/API `deepMerge`)
- Include/exclude filtering:
  - CLI (`--include`, `--exclude`)
  - In-file aliases (`IncludeGenerators`, `ExcludeGenerators`)
  - Plugin/API (`include`, `exclude`)
- Custom faker overrides:
  - In-file `const FakerOverrides = { ... }`
  - CLI `--faker-override key=expression`
  - Plugin/API `fakerOverrides`
  - Function-form override invocation modes
- Object-only root generator policy (skip scalar/array roots)
- Union handling improvements (literal unions and discriminated object unions)
- Diagnostics:
  - Warn on unmatched include/exclude filters
  - Warn on unused faker override keys
- Fail-on-warning mode:
  - CLI `--fail-on-warn`
  - API/plugin `failOnWarn`
- Comprehensive core generator tests with `bun:test`
- Expanded examples and docs (deep-merge behavior and feature usage)

## Remaining (Open)

### Medium Priority

- [ ] `@gen-gen-ignore` per-type/per-property controls
  - Skip specific generators or fields inline in source file
- [ ] Explicit optional/readonly/index-signature policy options
  - Define configurable behavior contract instead of implicit behavior
- [ ] Branded/opaque type support ergonomics
  - Dedicated alias/type mapping strategy beyond generic faker overrides
- [ ] Enum-specific strategy polish
  - Improve explicit enum member handling and docs

### Testing Gaps

- [x] Dedicated CLI watch-mode tests (debounce, repeated file changes, watcher refresh)
- [ ] Vite plugin tests (`buildStart`, `addWatchFile`, dev server watcher integration)

### Nice to Have

- [ ] Output formatting pass for generated code readability

## Notes on Scope Decisions

- "Custom faker strategy hooks" are partially delivered through `FakerOverrides` (file/CLI/plugin/API).
- A fully pluggable strategy API is still open if needed (e.g., external resolver callbacks).

## Suggested Next Implementation Order

1. Vite plugin tests
2. `@gen-gen-ignore` controls
3. Policy options for optional/readonly/index signatures
4. Branded/opaque type ergonomics
5. Enum-specific strategy polish
