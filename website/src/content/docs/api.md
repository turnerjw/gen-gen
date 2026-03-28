---
title: API Reference
summary: Programmatic usage with generateDataFile, GenerateOptions, and GenerateResult.
keywords: [api, generateDataFile, programmatic, typescript]
---

Use the programmatic API for custom build scripts, CI pipelines, or integration with other tools.

## Import

```ts
import { generateDataFile } from "gen-gen";
```

The main entry point `gen-gen` exports:

- `generateDataFile` -- the core generation function
- `GenerateOptions` -- options type
- `GenerateResult` -- result type
- `GenGenConfigOptions` -- config options type
- `FakerStrategyContext` -- strategy context type
- `FakerStrategyResult` -- strategy result type

The Vite plugin is exported from a separate entry point: `gen-gen/vite`.

## GenerateOptions

```ts
interface GenerateOptions {
  /** Path to the generator source file. Default: "data-gen.ts" */
  input?: string;

  /** Working directory to resolve input from. Default: process.cwd() */
  cwd?: string;

  /** Whether to write the result back to the file. Default: true */
  write?: boolean;

  /** Exit with error if generation emits warnings. Default: false */
  failOnWarn?: boolean;

  /** Reuse a TypeScript LanguageService for better performance in watch scenarios */
  languageService?: ts.LanguageService;
}
```

All configuration beyond these options (faker overrides, strategies, deep merge, filters, etc.) is read from inside the data-gen file itself. See [Configuration](/docs/configuration).

## GenerateResult

```ts
interface GenerateResult {
  /** Absolute path to the input file */
  inputPath: string;

  /** Whether the generated content differs from the existing file */
  changed: boolean;

  /** The full file content (original + generated section) */
  content: string;

  /** Files that should be watched for changes */
  watchedFiles: string[];

  /** Any warnings produced during generation */
  warnings: string[];
}
```

## Example: build script

```ts
import { generateDataFile } from "gen-gen";

const result = await generateDataFile({
  input: "src/data-gen.ts",
  write: true,
});

if (result.warnings.length > 0) {
  console.warn("Warnings:", result.warnings.join("\n"));
}

console.log(result.changed ? "Updated" : "No changes");
```

## Example: CI check without writing

```ts
const result = await generateDataFile({
  input: "src/data-gen.ts",
  write: false,
  failOnWarn: true, // throws if warnings exist
});

if (result.changed) {
  console.error("Generated code is out of date. Run gen-gen locally.");
  process.exit(1);
}
```

## Example: dry-run inspection

```ts
const result = await generateDataFile({
  input: "src/data-gen.ts",
  write: false,
});

// Inspect the generated content
console.log(result.content);
```
