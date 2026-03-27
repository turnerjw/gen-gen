---
title: Advanced Behavior
summary: Deep merge semantics, ignore tags, helper ergonomics, union handling, and diagnostics/policy behavior.
keywords: [deep merge, ignore, union, helpers, policy]
---

## Deep merge vs shallow merge

Default generation applies shallow spread for overrides. Use `--deep-merge` to recursively merge nested objects.

```bash
# shallow (default)
gen-gen --input data-gen.ts

# deep merge
gen-gen --input data-gen.ts --deep-merge
```

## Ignore tags and policies

- `@gen-gen-ignore` on a type skips root generator emission for that type.
- `@gen-gen-ignore` on a property emits a typed placeholder (`undefined as unknown as T` or `{}` for objects).
- Property policy supports optional, readonly, and index-signature behaviors.

## Helper ergonomics

Generated functions accept object overrides or callback overrides with nested helpers:

```ts
const order = generateOrder(({generateCustomer, generateItemsItem}) => ({
  customer: generateCustomer({email: "test@example.com"}),
  items: [generateItemsItem({quantity: 2})],
}));
```

- `generateX` helper names map to nested object fields.
- `generateXItem` helper names map to object-array item fields (first mergeable object element template).

## Union behavior

- String/number literal unions use `faker.helpers.arrayElement([...])`.
- Boolean literal unions (`true | false`) use `faker.datatype.boolean()`.
- Object unions are generated as branches and sampled with `arrayElement`.
- `T | null` and `T | undefined` use random presence (`faker.datatype.boolean() ? value : null/undefined`).

## Watch diagnostics

`--watch-diagnostics` logs watch trigger file paths plus per-run metrics (`elapsed`, `changed`, warnings count, and watched file count).
