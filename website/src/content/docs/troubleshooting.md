---
title: Troubleshooting
summary: Common CLI and generator warnings/errors with direct fixes based on real runtime messages.
keywords: [errors, warnings, diagnostics]
---

## Common CLI errors

- `Unknown argument: ...`: remove invalid flags or check spelling.
- `--watch cannot be combined with --check or --dry-run`: run these modes separately.
- `Expected --faker-override in the format key=expression`: ensure `=` is present and both sides are non-empty.
- `Unknown preset(s): ... Allowed presets: common, commerce.`: use supported preset names only.

## Generation warnings

- `Unmatched include filters: ...` / `Unmatched exclude filters: ...`: update stale filter names.
- `Unused faker overrides: ...`: key did not match; verify path/type text against generated types.
- `Skipped imported type ... generic type requires ConcreteGenerics entry.`: add concrete generic entries.
- `... only object types are supported for generators.`: root targets must be object-like types.
- `Ignored FakerOverrides: expected an object literal.`: inline object literal required for in-file override parsing.

## Debug flow

1. Run once with `--dry-run` to inspect generated output without writing.
2. Add `--fail-on-warn` in CI to stop on warning regressions.
3. Use `--watch --watch-diagnostics` locally to inspect trigger and timing behavior.
