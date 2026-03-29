---
name: test-with-gen-gen
description: Generate type-safe test data using gen-gen factory functions. Use when writing tests that need test data, creating test fixtures, or setting up mock data for TypeScript projects that have gen-gen installed.
---

# Writing Tests with gen-gen

Use gen-gen generators whenever a test needs structured data. Never hand-write full object literals — use `generateX()` functions instead. Override only what matters to the test; let gen-gen randomize the rest.

```ts
// GOOD — intent is clear: this test is about admin role behavior
const admin = generateUser({ role: "admin" });

// BAD — every field spelled out, test intent buried
const admin: User = { id: "1", name: "Alice", email: "a@b.com", role: "admin", avatar: "...", ... };
```

## Workflow

### 1. Check if a generator exists

Look at the project's `data-gen.ts` (usually `src/data-gen.ts`). Functions appear after the `Generated below - DO NOT EDIT` marker. Each imported type gets a `generateX()` function.

### 2. Add a missing type

Add a **type-only import** to the top of `data-gen.ts`, then regenerate:

```ts
import type { User, Order, NewType } from "./types";
```

### 3. Regenerate

```bash
npx gen-gen --input src/data-gen.ts
```

If the project uses the Vite plugin or `--watch` mode, generation happens automatically. Check `vite.config.ts` or `package.json` scripts before running manually.

### 4. Use in tests

```ts
import { generateOrder } from "../data-gen";

test("applies discount to orders over $100", () => {
  const order = generateOrder({ total: 150 });
  expect(applyDiscount(order)).toBe(true);
});
```

## Overrides

**Partial object:**
```ts
const user = generateUser({ role: "admin", email: "test@example.com" });
```

**Nested (deep merge, enabled by default):**
```ts
const draft = generateCheckoutDraft({
  shipping: { address: { city: "Portland" } },
});
// shipping.address.line1, postalCode, etc. remain random
```

**Callback helpers** for nested objects and array items:
```ts
const draft = generateCheckoutDraft((helpers) => ({
  shipping: { address: helpers.generateAddress({ city: "Portland" }) },
  items: helpers.generateItemsItems(3),
}));
```

**Pinning union/enum values:**
```ts
const errorResponse = generateApiResponse({ status: "error" });
const activeTicket = generateTicket({ status: Status.Active });
```

## Anti-patterns to avoid

| Don't | Do |
|---|---|
| Hand-write full object literals | `generateX({ relevantField: value })` |
| Share fixtures across tests | Generate fresh data per test |
| Ignore TS errors on test data | Use generators — always type-safe |
| Spread into generator output | Pass overrides to the generator |

## Quick reference

| Task | Command |
|---|---|
| Add a type | Add `import type { X }` to `data-gen.ts` |
| Regenerate | `npx gen-gen --input src/data-gen.ts` |
| Preview output | `npx gen-gen --dry-run --input src/data-gen.ts` |
| Check freshness (CI) | `npx gen-gen --check --input src/data-gen.ts` |

See [REFERENCE.md](REFERENCE.md) for FakerOverrides, FakerStrategy, GenGenConfig, and CLI flags.
