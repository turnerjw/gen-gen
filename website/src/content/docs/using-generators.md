---
title: Using Your Generators
summary: How to call generated functions, pass overrides, use nested helpers, and handle special cases.
keywords: [overrides, helpers, callbacks, ignore, unions]
---

Every type-only import in your `data-gen.ts` file produces a `generateX` function. This page covers how to call those functions and customize their output.

## Basic usage

Call the generator with no arguments for a fully random object:

```ts
import { generateUser } from "./data-gen";

const user = generateUser();
// { id: "xk7q2", name: "dolor", email: "amet", role: "admin" }
```

Every call returns fresh random data.

## Partial overrides

Pass a partial object to pin specific fields. Everything else stays random.

```ts
const admin = generateUser({ role: "admin" });
// role is always "admin", everything else is random
```

Overrides are type-safe -- TypeScript will error if you pass a field that doesn't exist on the type.

## Deep merge (default)

When your type has nested objects, overrides are deep-merged by default. You only need to specify the nested fields you care about.

```ts
// Given: type UserProfile = { profile: { name: string; settings: { theme: string; locale: string } } }
const user = generateUserProfile({
  profile: { settings: { theme: "dark" } },
});
// profile.settings.theme is "dark"
// profile.settings.locale is still random
// profile.name is still random
```

Without deep merge, passing `{ profile: { settings: { theme: "dark" } } }` would wipe out `locale` and `name`. Deep merge is enabled by default and can be disabled with `GenGenConfig` (see [Configuration](/docs/configuration)).

## Callback overrides with nested helpers

For more control over nested objects, pass a callback instead of a plain object. The callback receives typed helper functions for each nested object property.

```ts
const user = generateCheckoutDraft((helpers) => ({
  shipping: {
    address: helpers.generateAddress({ city: "Portland" }),
    instructions: "Leave at door",
  },
}));
// shipping.address.city is "Portland"
// shipping.address.line1, countryCode, postalCode are random
```

Helpers follow the naming convention `generate{PropertyName}` for nested object properties. For array items with object elements, you also get `generate{PropertyName}Item` and `generate{PropertyName}Items`:

```ts
const draft = generateCheckoutDraft((helpers) => ({
  shipping: {
    address: helpers.generateAddress({ city: "Portland" }),
    instructions: "Leave at door",
  },
  items: [
    helpers.generateItemsItem({ quantity: 3 }),
    helpers.generateItemsItem({ quantity: 1 }),
  ],
}));
```

The `generate{PropertyName}Items` helper generates multiple items at once:

```ts
const draft = generateCheckoutDraft((helpers) => ({
  items: helpers.generateItemsItems(5),
}));
// items has exactly 5 items with random data
```

## Union types

gen-gen handles union types automatically:

- **String literal unions** (`"idle" | "loading" | "error"`) use `faker.helpers.arrayElement(...)` to pick a random member.
- **Numeric literal unions** (`1 | 2 | 3`) work the same way.
- **Discriminated unions** (`{ kind: "user"; ... } | { kind: "order"; ... }`) pick a random variant.
- **Nullable types** (`string | null`) randomly choose between the value and `null`.
- **Optional types** (`string | undefined`) randomly choose between the value and `undefined`.

To pin a specific union variant in a test, just override the relevant field:

```ts
const example = generateUnionExample({ status: "error" });
```

## Excluding types with @gen-gen-ignore

Add a `@gen-gen-ignore` JSDoc tag to skip an entire type or a specific property during generation.

On a type -- gen-gen skips the type entirely:

```ts
/** @gen-gen-ignore */
export type InternalOnly = {
  token: string;
};
```

On a property -- gen-gen emits an empty cast (`{} as T`) for that property:

```ts
export type Account = {
  id: string;
  /** @gen-gen-ignore */
  profile: {
    locale: string;
    timezone: string;
  };
  email: string;
};
```

The generated `generateAccount` will have `profile: {} as { locale: string; timezone: string }` -- you can override it in tests when needed.

