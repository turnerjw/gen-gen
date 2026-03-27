---
title: CLI Reference
summary: Complete command-line options, constraints, and copy-paste examples.
keywords: [cli, flags, watch, commands]
---

## Usage

```bash
gen-gen [options]
```

## Options

- `-i, --input <path>`: input source file (default: `data-gen.ts`)
- `--cwd <path>`: working directory used to resolve `--input`
- `--check`: exits `1` when generated section is stale
- `--dry-run`: prints resulting file to stdout without writing
- `--fail-on-warn`: fails generation if warnings exist
- `--optional-properties <include|omit>`
- `--readonly-properties <include|warn>`
- `--index-signatures <ignore|warn>`
- `--faker-strategy <path>`: loads module default export or named `fakerStrategy` export
- `--preset <name[,name...]>`: `common`, `commerce`
- `-w, --watch`: continuous regeneration
- `--watch-diagnostics`: logs trigger source and per-run metrics
- `--deep-merge`: deep-merge object overrides instead of shallow top-level spread
- `--include <csv>`: include generators/types by filter keys
- `--exclude <csv>`: exclude generators/types by filter keys
- `--faker-override key=expression`: repeatable CLI override mapping

## Examples

```bash
# single run
npx gen-gen --input example/basic/data-gen.ts

# stale-check in CI
npx gen-gen --input data-gen.ts --check

# watch with diagnostics
npx gen-gen --input data-gen.ts --watch --watch-diagnostics

# deep merge + presets + filter
npx gen-gen --input data-gen.ts --deep-merge --preset common,commerce --include User,Account

# explicit faker override(s)
npx gen-gen --input data-gen.ts --faker-override email=faker.internet.email()
```

## Notes

- `--watch` cannot be combined with `--check` or `--dry-run`.
- Unknown include/exclude filters produce warnings (they do not silently fail).
- Unused faker override keys also produce warnings to surface typos.
