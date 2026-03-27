---
title: API Reference
summary: Use generateDataFile programmatically for scripts, custom build steps, or fine-grained control.
keywords: [api, generateDataFile, typescript]
---

## Import

```ts
import {generateDataFile} from "gen-gen";
```

## GenerateOptions

```ts
interface GenerateOptions {
  input?: string;
  cwd?: string;
  markerText?: string;
  write?: boolean;
  failOnWarn?: boolean;
  propertyPolicy?: {
    optionalProperties?: "include" | "omit";
    readonlyProperties?: "include" | "warn";
    indexSignatures?: "ignore" | "warn";
  };
  deepMerge?: boolean;
  typeMappingPresets?: Array<"common" | "commerce">;
  include?: string[];
  exclude?: string[];
  fakerOverrides?: Record<string, string | ((faker) => unknown)>;
  fakerStrategy?: (ctx) => string | ((faker) => unknown) | {expression: string; invokeMode?: "raw" | "call" | "callWithFaker"} | undefined;
}
```

## GenerateResult

```ts
interface GenerateResult {
  inputPath: string;
  changed: boolean;
  content: string;
  watchedFiles: string[];
  warnings: string[];
}
```

## Example

```ts
const result = await generateDataFile({
  input: "data-gen.ts",
  write: false,
  typeMappingPresets: ["common"],
  fakerStrategy(ctx) {
    if (ctx.path.endsWith("email")) {
      return "faker.internet.email()";
    }
    return undefined;
  },
});

if (result.warnings.length > 0) {
  console.warn(result.warnings.join("\n"));
}
```
