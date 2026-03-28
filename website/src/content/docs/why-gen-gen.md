---
title: Why gen-gen?
summary: The test data maintenance problem gen-gen solves, with before/after test suites showing the impact.
keywords: [why, philosophy, maintenance, test data]
---

## The problem

Every time you add a field to a type, you update every test fixture that uses it. If `User` gains a `preferences` object, you might touch 30 test files -- not because the tests care about preferences, but because TypeScript demands a complete object.

This leads to a few bad outcomes:

1. **Fixture maintenance scales with your schema.** One new field means N fixture updates across your test suite.
2. **Test intent gets buried.** A test for "admin users see settings" has to construct a full user object. The reader has to scan past 15 irrelevant fields to find `role: "admin"`.
3. **Test data goes stale.** Fixtures get copy-pasted, values become meaningless constants, and tests stop catching real bugs because every test uses the same hardcoded data.
4. **Shared fixtures create hidden coupling.** To avoid repeating themselves, teams extract test data into a shared file or define it globally at the top of the test. Now changing one test's data can break another. Tests that should be independent aren't.
5. **Global test data hides what matters.** When `testUser` is defined 50 lines above the test that uses it, the reader has to scroll up to understand what's being tested. The test no longer tells its own story.

## Without gen-gen

Here's a typical test suite for a user profile component, written with manual fixtures:

```ts
test("displays the user name", () => {
  const user: User = {
    id: "user-1",
    name: "Alice",
    email: "alice@example.com",
    role: "member",
    avatar: "https://example.com/avatar.png",
    preferences: { theme: "dark", locale: "en-US" },
    createdAt: "2024-01-01T00:00:00Z",
  };
  expect(renderName(user)).toBe("Alice");
});

test("admin users see the settings link", () => {
  const user: User = {
    id: "user-2",
    name: "Bob",
    email: "bob@example.com",
    role: "admin",
    avatar: "https://example.com/avatar.png",
    preferences: { theme: "dark", locale: "en-US" },
    createdAt: "2024-01-01T00:00:00Z",
  };
  expect(hasSettingsLink(user)).toBe(true);
});

test("formats the creation date", () => {
  const user: User = {
    id: "user-3",
    name: "Carol",
    email: "carol@example.com",
    role: "member",
    avatar: "https://example.com/avatar.png",
    preferences: { theme: "dark", locale: "en-US" },
    createdAt: "2024-06-15T12:00:00Z",
  };
  expect(formatDate(user.createdAt)).toBe("Jun 15, 2024");
});
```

Now add `bio: string` to `User`. All three tests break at compile time. You manually add `bio: "..."` to each one, even though none of them test the bio.

## With gen-gen

```ts
test("displays the user name", () => {
  const user = generateUser({ name: "Alice" });
  expect(renderName(user)).toBe("Alice");
});

test("admin users see the settings link", () => {
  const user = generateUser({ role: "admin" });
  expect(hasSettingsLink(user)).toBe(true);
});

test("formats the creation date", () => {
  const user = generateUser({ createdAt: "2024-06-15T12:00:00Z" });
  expect(formatDate(user.createdAt)).toBe("Jun 15, 2024");
});
```

Add `bio: string` to `User`. Re-run `npx gen-gen`. Zero test changes. The generator picks up the new field automatically, fills it with random data, and every test keeps compiling.

Each test now declares only the fields it cares about. The reader immediately sees what's being tested.

## The philosophy

gen-gen is a **code generator**, not a runtime library. It reads your TypeScript source at build time and writes plain functions into your codebase. There's no runtime dependency, no special test harness, no reflection. The generated code is regular TypeScript that you can read, debug, and version control.

The generated functions use `@faker-js/faker` so every call produces different data. This helps catch bugs that only appear with certain value combinations -- something hardcoded fixtures can never do.

Overrides are type-safe. If you rename `role` to `userRole`, TypeScript catches every test that passes `{ role: "admin" }` as an override. You don't get silent breakage from string-keyed factory definitions.
