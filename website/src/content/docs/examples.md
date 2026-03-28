---
title: Examples
summary: Short, self-contained recipes for common gen-gen scenarios.
keywords: [examples, recipes, patterns, testing]
---

Each example below is self-contained. Copy the type definition, add it to your `data-gen.ts` imports, and run gen-gen.

## Testing error states

Pin a nullable or union field to the error case:

```ts
// types.ts
export type ApiResponse = {
  data: string | null;
  error: string | null;
  status: "success" | "error" | "pending";
};

// test
const errorResponse = generateApiResponse({
  data: null,
  error: "Something went wrong",
  status: "error",
});
expect(renderError(errorResponse)).toContain("Something went wrong");
```

## Nested objects with deep merge

Override a deeply nested field without replacing sibling properties:

```ts
// types.ts
export type UserFixture = {
  profile: {
    name: string;
    settings: {
      theme: string;
      locale: string;
    };
  };
};

// test -- only override theme, locale stays random
const user = generateUserFixture({
  profile: { settings: { theme: "dark" } },
});
expect(user.profile.settings.theme).toBe("dark");
expect(user.profile.name).toBeTruthy(); // still populated
```

## Discriminated unions

gen-gen picks a random variant. Override to test a specific one:

```ts
// types.ts
export type EventPayload =
  | { kind: "user"; userId: string; admin: boolean }
  | { kind: "order"; orderId: number; total: number };

export type Event = {
  id: string;
  payload: EventPayload;
};

// test -- force the user variant
const event = generateEvent({
  payload: { kind: "user", userId: "u-123", admin: true },
});
```

## Composing generators

Use one generator's output as an override for another:

```ts
// types.ts
export type UserSummary = {
  id: string;
  handle: string;
  role: "admin" | "member";
};

export type ApiEnvelope<T> = {
  data: T;
  requestId: string;
  error?: string;
};

// data-gen.ts
import type { UserSummary, ApiEnvelope } from "./types";
type ConcreteGenerics = [ApiEnvelope<UserSummary>];

// test
const envelope = generateUserSummaryApiEnvelope({
  data: generateUserSummary({ role: "admin" }),
  error: undefined,
});
```

## Callback helpers for nested objects

Use the callback form to access typed helper functions:

```ts
// types.ts
export type CheckoutDraft = {
  orderId: string;
  profile: { fullName: string; email: string; marketingOptIn: boolean };
  shipping: {
    address: { line1: string; city: string; countryCode: string; postalCode: string };
    instructions: string;
  };
  tags: string[];
};

// test
const draft = generateCheckoutDraft((helpers) => ({
  shipping: {
    address: helpers.generateAddress({ city: "Portland", countryCode: "US" }),
    instructions: "Leave at door",
  },
}));
```

## Custom faker expressions

Use `FakerOverrides` to produce semantically meaningful data:

```ts
// data-gen.ts
import type { User } from "./types";

const FakerOverrides = {
  "User.id": () => faker.string.uuid(),
  email: () => faker.internet.email(),
  "User.createdAt": () => faker.date.recent().toISOString(),
} as const;

/**
 * Generated below - DO NOT EDIT
 */
```

Now `generateUser()` produces realistic UUIDs, email addresses, and ISO date strings instead of generic random words.

## Faker strategy for project-wide conventions

When many types share the same conventions, use a `FakerStrategy` instead of repeating overrides:

```ts
// data-gen.ts
const FakerStrategy = (ctx) => {
  if (ctx.propertyName === "email") {
    return { expression: "faker.internet.email()", invokeMode: "raw" };
  }
  if (ctx.propertyName === "id" && ctx.typeText === "string") {
    return { expression: "faker.string.uuid()", invokeMode: "raw" };
  }
  return undefined;
};
```

This applies to every `email` and string `id` property across all generated types in that file.

## Generic types

Generic types require `ConcreteGenerics` entries:

```ts
// types.ts
export type Edge<T> = { node: T; cursor: string };
export type Connection<T> = { edges: Edge<T>[]; hasNextPage: boolean };

// data-gen.ts
import type { UserSummary, Connection } from "./types";
type ConcreteGenerics = [Connection<UserSummary>];

// Generates: generateUserSummaryConnection(overrides?)
```

## Filtering types

Control which imported types get generators:

```ts
// data-gen.ts
import type { Account, Profile, Session, Envelope } from "./types";

// Only generate for Account and Session
type IncludeGenerators = [Account, Session];

// Or exclude specific types
type ExcludeGenerators = [Envelope<Session>];
```

## Enums

TypeScript enums work automatically:

```ts
// types.ts
export enum Status {
  Draft = "draft",
  Active = "active",
  Closed = "closed",
}

export type Ticket = {
  status: Status;
  title: string;
};

// Generated: status: faker.helpers.arrayElement(["draft", "active", "closed"]) as Status

// test -- pin to a specific value
const ticket = generateTicket({ status: Status.Active });
```

## Branded types

Branded primitives are cast correctly:

```ts
// types.ts
export type UserId = string & { readonly __brand: "UserId" };
export type AmountCents = number & { readonly __brand: "AmountCents" };

export type Invoice = {
  id: UserId;
  total: AmountCents;
  note?: string;
};

// Generated: id: faker.word.noun() as UserId
// Generated: total: faker.number.int({ min: 1, max: 1000 }) as AmountCents
```

## Skipping properties with @gen-gen-ignore

Exclude internal or complex properties from generation:

```ts
// types.ts
export type Account = {
  id: string;
  /** @gen-gen-ignore */
  profile: { locale: string; timezone: string };
  email: string;
};

// Generated: profile: {} as { locale: string; timezone: string }

// test -- override when you need it
const account = generateAccount({
  profile: { locale: "en-US", timezone: "America/New_York" },
});
```
