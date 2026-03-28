---
title: CLI Reference
summary: All 7 command-line flags with copy-paste examples.
keywords: [cli, flags, watch, commands]
---

## Usage

```bash
gen-gen [options]
```

## Flags

| Flag | Short | Description |
|---|---|---|
| `--input <path>` | `-i` | Path to the generator source file. Default: `data-gen.ts` |
| `--cwd <path>` | | Working directory used to resolve `--input` |
| `--check` | | Exit with code 1 if the generated section is out of date. Does not write. |
| `--dry-run` | | Print the resulting file content to stdout without writing. |
| `--fail-on-warn` | | Exit with an error if generation produces any warnings. |
| `--watch` | `-w` | Watch for file changes and regenerate automatically. |
| `--help` | `-h` | Show the help message. |

## Examples

### Single run

```bash
npx gen-gen --input src/data-gen.ts
```

### CI freshness check

Verify that generated code is up to date. Useful in CI pipelines.

```bash
npx gen-gen --input src/data-gen.ts --check
```

If the generated section doesn't match what gen-gen would produce, the process exits with code 1.

### Preview without writing

```bash
npx gen-gen --input src/data-gen.ts --dry-run
```

### Fail on warnings in CI

Combine with `--check` or use standalone to catch stale faker overrides, unmatched filters, or other issues.

```bash
npx gen-gen --input src/data-gen.ts --check --fail-on-warn
```

### Watch mode

Continuously regenerate when your types or data-gen file change.

```bash
npx gen-gen --input src/data-gen.ts --watch
```

Watch mode automatically tracks all non-`node_modules`, non-`.d.ts` source files that the TypeScript compiler discovers. When any of them change, generation re-runs with an 80ms debounce.

Set the `GEN_GEN_WATCH_DIAGNOSTICS=1` environment variable to log trigger files and per-run timing metrics.

### Custom working directory

```bash
npx gen-gen --input data-gen.ts --cwd packages/my-package
```

## Constraints

- `--watch` cannot be combined with `--check` or `--dry-run`.
- Unknown arguments cause an immediate error.
- The default input file is `data-gen.ts` in the current working directory (or `--cwd`).

## Configuration that lives in the file

Many things that look like they might be CLI flags are actually configured inside your `data-gen.ts` file: `FakerOverrides`, `FakerStrategy`, `GenGenConfig` (deep merge, optional properties, index signatures), `IncludeGenerators`, `ExcludeGenerators`, and `ConcreteGenerics`. See [Configuration](/docs/configuration) for details.
