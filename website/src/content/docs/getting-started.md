---
title: Getting Started
summary: Install gen-gen, create your first generator file, and use it in a test with overrides.
keywords: [install, quickstart, first run, overrides]
---

gen-gen reads your TypeScript types and generates fully-typed factory functions backed by [Faker.js](https://fakerjs.dev/). You write the types, gen-gen writes the boilerplate.

## Install

```bash
npm install --save-dev @trnr/gen-gen @faker-js/faker
```

## 1. Define your types

Create a file with the types you want generators for. This is your normal application code -- gen-gen reads it, it doesn't modify it.

```ts
// src/types.ts
export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
};
```

## 2. Create your generator file

Create a `data-gen.ts` file that imports the types you want generators for. Use **type-only imports** to tell gen-gen which types to target.

```ts
// src/data-gen.ts
import type { User } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
```

The marker comment is required. gen-gen writes all generated code below it.

## 3. Run gen-gen

```bash
npx gen-gen --input src/data-gen.ts
```

gen-gen reads the type imports, generates a `generateUser` function, and writes it into your `data-gen.ts` file. The generated function produces a complete `User` object with random Faker data every time you call it.

## 4. Use it in a test

Import the generated function and call it. Every field is populated automatically.

```ts
import { generateUser } from "./data-gen";

test("displays the user name", () => {
  const user = generateUser();
  // user has all fields filled with random data
  expect(renderName(user)).toBeTruthy();
});
```

## 5. Override only what matters

When a test cares about specific values, pass overrides as a partial object. Every other field stays random.

```ts
test("admin users see the settings link", () => {
  const admin = generateUser({ role: "admin" });
  expect(admin.role).toBe("admin");
  // name, email, id are all still random
});

test("member users don't see the settings link", () => {
  const member = generateUser({ role: "member" });
  expect(member.role).toBe("member");
});
```

This is the core loop: your tests only specify the data they care about. When you add a new field to `User`, re-run gen-gen and every test still compiles -- no manual fixture updates needed.

## Next steps

- [Why gen-gen?](/docs/why-gen-gen) -- understand the problem gen-gen solves
- [Using Your Generators](/docs/using-generators) -- overrides, nested helpers, callbacks, and composition
- [Configuration](/docs/configuration) -- faker overrides, strategies, and in-file options
