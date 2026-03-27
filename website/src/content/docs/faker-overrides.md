---
title: Faker Overrides and Strategies
summary: Override matching order, precedence rules, and strategy hooks for scalable custom data generation.
keywords: [faker, overrides, strategy, precedence]
---

## Override key matching order

1. `<RootType>.<path.to.field>` (example: `Pokemon.id`)
2. `path.to.field` (example: `profile.locale`)
3. Final property name (example: `email`)
4. Declared type text (when available)
5. Type alias name
6. Resolved type text (example: `APIResponse<Pokemon>`)

## Precedence

1. Direct `fakerOverrides` match
2. `fakerStrategy` return value
3. `typeMappingPresets` match
4. Built-in default type generation

## CLI overrides

```bash
npx gen-gen --input data-gen.ts \
  --faker-override email=faker.internet.email() \
  --faker-override Pokemon.id=faker.number.int({min:10000,max:99999})
```

## Strategy module (CLI)

```bash
npx gen-gen --input data-gen.ts --faker-strategy ./faker-strategy.ts
```

```ts
export default function fakerStrategy(ctx) {
  if (ctx.rootTypeText === "User" && ctx.path === "id") {
    return {expression: "faker.string.uuid()", invokeMode: "raw"};
  }
  if (ctx.path.endsWith("email")) {
    return (faker) => faker.internet.email();
  }
  return undefined;
}
```

Unused override keys emit warnings so typos and stale mappings are visible during generation.
