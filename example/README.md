# Examples

- `data-gen.ts` + `types.ts` + `usage.ts`: base nested helper callback usage.
- `usage-nested.ts`: recursive helper callback usage (`generateB` -> `generateE`).
- `data-gen-generics.ts` + `generics-types.ts` + `usage-generics.ts`: concrete generics via `ConcreteGenerics`.
- `data-gen-unions.ts` + `unions-types.ts` + `usage-unions.ts`: literal unions and discriminated object unions.
- `data-gen-deep-merge.ts` + `deep-merge-types.ts` + `usage-deep-merge.ts`: deep-merge generation behavior.
- `data-gen-filters.ts` + `filters-types.ts` + `usage-filters.ts`: include/exclude generator filtering.
- `data-gen-custom-faker.ts` + `custom-faker-types.ts` + `usage-custom-faker.ts`: custom faker override expressions.
- `data-gen-ignore.ts` + `ignore-types.ts` + `usage-ignore.ts`: `@gen-gen-ignore` for type/property control.
- `data-gen-policy.ts` + `policy-types.ts` + `usage-policy.ts`: optional/readonly/index-signature policy settings.
- `data-gen-branded.ts` + `branded-types.ts` + `usage-branded.ts`: branded/opaque primitive alias generation.
- `data-gen-enums.ts` + `enum-types.ts` + `usage-enums.ts`: enum-aware value generation from enum members.

Generate each file with:

```bash
bun ./dist/cli.js --input example/data-gen-generics.ts
bun ./dist/cli.js --input example/data-gen-unions.ts
bun ./dist/cli.js --input example/data-gen-deep-merge.ts --deep-merge
bun ./dist/cli.js --input example/data-gen-filters.ts --include Account,Session --exclude Session
bun ./dist/cli.js --input example/data-gen-custom-faker.ts --faker-override email=faker.internet.email()
bun ./dist/cli.js --input example/data-gen-ignore.ts
bun ./dist/cli.js --input example/data-gen-policy.ts --optional-properties omit --readonly-properties warn --index-signatures warn
bun ./dist/cli.js --input example/data-gen-branded.ts
bun ./dist/cli.js --input example/data-gen-enums.ts
```
