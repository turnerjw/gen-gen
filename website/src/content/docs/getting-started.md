---
title: Getting Started
summary: Install gen-gen, create a data-gen input file, and generate your first factories in under five minutes.
keywords: [install, quickstart, first run]
---

## 1. Install

```bash
npm install -D gen-gen typescript @faker-js/faker
```

## 2. Create input file

Create `data-gen.ts` and import the types you want factory functions for:

```ts
import type {Pokemon} from "./types";

/**
 * Generated below - DO NOT EDIT
 */
```

## 3. Run generation

```bash
npx gen-gen --input data-gen.ts
```

`gen-gen` replaces everything after the marker and emits functions like `generatePokemon(overrides?)`.

## 4. Use generated helpers

```ts
const user = generateUser(({generateProfile}) => ({
  profile: generateProfile({locale: "en-CA"}),
}));
```

Helper callbacks include object helpers (`generateProfile`) and array-item helpers (`generateItemsItem`) for nested object arrays.
