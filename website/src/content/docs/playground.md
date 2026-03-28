---
title: Playground
summary: Interactive playground for trying gen-gen with single-file type declarations.
keywords: [playground, interactive, try, single-file]
---

## Supported input

The playground accepts single-file type declarations. Define your types inline and see the generated output.

```ts
// Basic object
type User = { id: string; email: string; role: "admin" | "member" };

// Nested objects
type Order = {
  id: string;
  customer: { name: string; email: string };
  total: number;
};

// Union types
type Event =
  | { kind: "click"; x: number; y: number }
  | { kind: "scroll"; offset: number };
```

## Limitations

- **No external imports.** The playground operates on a single file, so it can't resolve imports from other modules.
- **No cross-file resolution.** Types must be fully defined in the playground input.
- **Large generic graphs** may need to be simplified to concrete type aliases first.

## Starter snippets

Try pasting these into the playground:

```ts
// 1) Basic object
type User = { id: string; email: string };

// 2) String literal union
type Status = "idle" | "loading" | "error";
type Task = { name: string; status: Status };

// 3) Generic concrete type
type ApiResponse<T> = { data: T; error?: string };
type UserResponse = ApiResponse<User>;
```

## Common errors

- **Non-object root type**: generation targets must be object-like types. Primitives, arrays, and functions are skipped.
- **Unresolved type**: if you reference a type that isn't defined in the playground, it won't resolve.
- **Invalid override keys**: unused override keys produce warnings just like in the CLI.
