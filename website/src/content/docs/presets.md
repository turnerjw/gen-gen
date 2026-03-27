---
title: Type Mapping Presets
summary: Presets provide convention-based mappings for common property names before falling back to generic faker defaults.
keywords: [preset, type mapping, common, commerce]
---

## Available presets

- `common`: fields like `email`, `url`, `phone`, `firstName`, `lastName`, `username`, `id`.
- `commerce`: fields like `currency`, `amount`, `price`, `subtotal`, `total`, `tax`.

## CLI

```bash
npx gen-gen --input data-gen.ts --preset common,commerce
```

## API / plugin

```ts
generateDataFile({
  input: "data-gen.ts",
  typeMappingPresets: ["common", "commerce"],
});
```

## Interaction with overrides

Presets run after direct `fakerOverrides` and `fakerStrategy`. If you need strict control for a field, define an explicit override key or strategy rule for that field.
