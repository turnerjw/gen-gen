---
title: Vite Plugin Reference
summary: genGenPlugin runs generation during Vite startup/build and watches relevant files for regeneration.
keywords: [vite, plugin, dev server]
---

## Setup

```ts
import {defineConfig} from "vite";
import {genGenPlugin} from "gen-gen";

export default defineConfig({
  plugins: [
    genGenPlugin({
      input: "data-gen.ts",
      failOnWarn: true,
      watchDiagnostics: true,
      deepMerge: true,
      include: ["User", "Account"],
      fakerOverrides: {
        email: "faker.internet.email()",
      },
    }),
  ],
});
```

## Options

Plugin options mirror `generateDataFile` options with Vite-specific watch integration. Key options are `input`, `failOnWarn`, `propertyPolicy`, `deepMerge`, `typeMappingPresets`, `watchDiagnostics`, `include`, `exclude`, `fakerOverrides`, and `fakerStrategy`.

## Watch behavior

- When watched files change, generation runs again.
- If generated output changed, plugin sends a full reload.
- With `watchDiagnostics: true`, trigger file and per-run metrics are logged.
