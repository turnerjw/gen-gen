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
- Pluggable faker strategy hooks:
  - API/plugin `fakerStrategy(context) => override | undefined`
  - Direct overrides still take precedence over strategy
- CLI strategy parity:
  - `--faker-strategy <module-path>` (default export or named `fakerStrategy`)
  - Watch mode tracks strategy module changes
- Type-mapping presets:
  - `common` and `commerce` presets via API/plugin/CLI
  - Precedence: `FakerOverrides` > `fakerStrategy` > preset > defaults
- Performance tuning for large type graphs:
  - Cached `typeToString`, `getPropertiesOfType`, and enum value extraction during a generation run
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

- [x] `@gen-gen-ignore` per-type/per-property controls
  - Skip specific generators or fields inline in source file
- [x] Explicit optional/readonly/index-signature policy options
  - Define configurable behavior contract instead of implicit behavior
- [x] Branded/opaque type support ergonomics
  - Dedicated alias/type mapping strategy beyond generic faker overrides
- [x] Enum-specific strategy polish
  - Improve explicit enum member handling and docs

### Testing Gaps

- [x] Dedicated CLI watch-mode tests (debounce, repeated file changes, watcher refresh)
- [x] Vite plugin tests (`buildStart`, `addWatchFile`, dev server watcher integration)

### Nice to Have

- [x] Output formatting pass for generated code readability

## Notes on Scope Decisions

- Pluggable faker strategy hooks are now supported via API/plugin `fakerStrategy`.
- CLI still favors explicit `--faker-override` expressions for simplicity.

## Suggested Next Implementation Order

1. Extended watch diagnostics and metrics
2. Expanded generated helper typing ergonomics
3. Optional generator output presets
4. Additional union/recursive edge-case hardening
5. Strategy authoring ergonomics (helper utilities)
