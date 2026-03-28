---
title: Vite Plugin Reference
summary: Run gen-gen automatically during Vite dev and build with the genGenPlugin.
keywords: [vite, plugin, dev server, build]
---

The Vite plugin runs gen-gen during `vite dev` and `vite build`, and watches for type changes during development.

## Import

```ts
import { genGenPlugin } from "gen-gen/vite";
```

## Setup

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { genGenPlugin } from "gen-gen/vite";

export default defineConfig({
  plugins: [
    genGenPlugin(),
  ],
});
```

## GenGenPluginOptions

```ts
interface GenGenPluginOptions {
  /** Path to the generator source file. Default: "data-gen.ts" */
  input?: string;

  /** Exit with error if generation emits warnings. Default: false */
  failOnWarn?: boolean;
}
```

All other configuration (faker overrides, strategies, deep merge, filters) lives inside the data-gen file. See [Configuration](/docs/configuration).

## How it works

1. **Build start** -- the plugin runs generation and writes the output. It registers all discovered source files as watch dependencies via Vite's `addWatchFile` API.

2. **Dev server** -- the plugin listens for file changes through Vite's watcher. When a watched file changes, generation re-runs. If the output changed, the plugin triggers a full page reload so your tests or app pick up the new generators.

## Example with options

```ts
export default defineConfig({
  plugins: [
    genGenPlugin({
      input: "src/data-gen.ts",
      failOnWarn: true,
    }),
  ],
});
```