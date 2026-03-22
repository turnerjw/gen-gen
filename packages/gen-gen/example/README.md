# Examples

- `basic/`: base nested helper callback usage (`data-gen.ts`, `types.ts`, `usage.ts`, `usage-nested.ts`).
- `generics/`: concrete generics via `ConcreteGenerics`.
- `unions/`: literal unions and discriminated object unions.
- `deep-merge/`: deep-merge generation behavior.
- `filters/`: include/exclude generator filtering.
- `custom-faker/`: custom faker override expressions.
- `ignore/`: `@gen-gen-ignore` for type/property control.
- `policy/`: optional/readonly/index-signature policy settings.
- `branded/`: branded/opaque primitive alias generation.
- `enums/`: enum-aware value generation from enum members.

Generate each file with:

```bash
bun ./dist/cli.js --input example/basic/data-gen.ts
bun ./dist/cli.js --input example/generics/data-gen-generics.ts
bun ./dist/cli.js --input example/unions/data-gen-unions.ts
bun ./dist/cli.js --input example/deep-merge/data-gen-deep-merge.ts --deep-merge
bun ./dist/cli.js --input example/filters/data-gen-filters.ts --include Account,Session --exclude Session
bun ./dist/cli.js --input example/custom-faker/data-gen-custom-faker.ts --faker-override email=faker.internet.email()
bun ./dist/cli.js --input example/ignore/data-gen-ignore.ts
bun ./dist/cli.js --input example/policy/data-gen-policy.ts --optional-properties omit --readonly-properties warn --index-signatures warn
bun ./dist/cli.js --input example/branded/data-gen-branded.ts
bun ./dist/cli.js --input example/enums/data-gen-enums.ts
```
