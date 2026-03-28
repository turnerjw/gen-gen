---
title: Playground
summary: MVP playground guidance: supported input scope, known limitations, starter snippets, and typical parse errors.
keywords: [playground, limitations, single-file]
---

## Supported input scope (MVP)

- Single-file type declarations only.
- No external imports in playground mode.
- Object-like root types are supported generation targets.

## Known limitations

- Cross-file symbol resolution is not available in playground scope.
- Output should be copied into project `data-gen.ts` files for persistent use.
- Large complex generic graphs may require simplifying to concrete aliases first.

## Starter snippets

```ts
// 1) Basic object
type User = { id: string; email: string };

// 2) Union
type Contact = { kind: "email"; value: string } | { kind: "phone"; value: string };

// 3) Generic concrete type
type ApiResponse<T> = { data: T; error?: string };
type Concrete = ApiResponse<User>;
```

## Typical parse/generation errors

- Non-object root type: generation target skipped.
- Invalid override keys: unused override warning.
- Unsupported imported symbol in playground scope: unresolved/unsupported target warning.
