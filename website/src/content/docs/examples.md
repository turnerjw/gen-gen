---
title: Examples
summary: Copy-paste commands and snippets synchronized with the /example directory in this repository.
keywords: [examples, copy paste, sample]
---

## Folders

- `example/basic`: nested helper callback usage
- `example/generics`: `ConcreteGenerics`
- `example/unions`: literal + object unions
- `example/deep-merge`: deep-merge behavior
- `example/filters`: include/exclude filters
- `example/custom-faker`: overrides + custom expressions
- `example/ignore`: `@gen-gen-ignore` behavior
- `example/policy`: optional/readonly/index-signature policy
- `example/branded`: branded primitive aliases
- `example/enums`: enum member generation

## Generate all examples

```bash
bun run gen:example
```

## Targeted commands

```bash
bun ./dist/cli.js --input example/basic/data-gen.ts
bun ./dist/cli.js --input example/unions/data-gen-unions.ts
bun ./dist/cli.js --input example/deep-merge/data-gen-deep-merge.ts --deep-merge
bun ./dist/cli.js --input example/custom-faker/data-gen-custom-faker.ts --faker-override email=faker.internet.email()
```
