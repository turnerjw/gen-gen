#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {generateDataFile} from "./generator.js";

interface CliOptions {
  input?: string;
  cwd?: string;
  check: boolean;
  dryRun: boolean;
  failOnWarn: boolean;
  watch: boolean;
  deepMerge: boolean;
  include: string[];
  exclude: string[];
  fakerOverrides: Record<string, string>;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const options = parseArgs(args);
  if (options.watch) {
    if (options.check || options.dryRun) {
      throw new Error("--watch cannot be combined with --check or --dry-run.");
    }

    await runWatchMode(options);
    return;
  }

  const result = await generateDataFile({
    input: options.input,
    cwd: options.cwd,
    write: !options.dryRun && !options.check,
    failOnWarn: options.failOnWarn,
    deepMerge: options.deepMerge,
    include: options.include,
    exclude: options.exclude,
    fakerOverrides: options.fakerOverrides,
  });

  for (const warning of result.warnings) {
    console.warn(`[gen-gen] ${warning}`);
  }

  if (options.check) {
    if (result.changed) {
      console.error(`[gen-gen] ${path.relative(process.cwd(), result.inputPath)} is out of date.`);
      process.exitCode = 1;
      return;
    }

    console.log(`[gen-gen] ${path.relative(process.cwd(), result.inputPath)} is up to date.`);
    return;
  }

  if (options.dryRun) {
    console.log(result.content);
    return;
  }

  const verb = result.changed ? "Generated" : "No changes for";
  console.log(`[gen-gen] ${verb} ${path.relative(process.cwd(), result.inputPath)}`);
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    check: false,
    dryRun: false,
    failOnWarn: false,
    watch: false,
    deepMerge: false,
    include: [],
    exclude: [],
    fakerOverrides: {},
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "--input" || arg === "-i") {
      options.input = args[i + 1];
      i += 1;
      continue;
    }

    if (arg === "--cwd") {
      options.cwd = args[i + 1];
      i += 1;
      continue;
    }

    if (arg === "--check") {
      options.check = true;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--fail-on-warn") {
      options.failOnWarn = true;
      continue;
    }

    if (arg === "--watch" || arg === "-w") {
      options.watch = true;
      continue;
    }

    if (arg === "--deep-merge") {
      options.deepMerge = true;
      continue;
    }

    if (arg === "--include") {
      options.include.push(...parseListArg(args[i + 1]));
      i += 1;
      continue;
    }

    if (arg === "--exclude") {
      options.exclude.push(...parseListArg(args[i + 1]));
      i += 1;
      continue;
    }

    if (arg === "--faker-override") {
      const {key, expression} = parseOverrideArg(args[i + 1]);
      options.fakerOverrides[key] = expression;
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printHelp(): void {
  console.log(`gen-gen

Usage:
  gen-gen [options]

Options:
  -i, --input <path>  Path to generator source file (default: data-gen.ts)
      --cwd <path>    Working directory to resolve input from
      --check         Exit 1 if generated section is out of date
      --dry-run       Print resulting file content to stdout
      --fail-on-warn  Exit with error if generation emits warnings
  -w, --watch         Regenerate on file changes
      --deep-merge    Deep merge overrides instead of shallow spread
      --include       Comma-separated generator/type filters to include
      --exclude       Comma-separated generator/type filters to exclude
      --faker-override  key=expression override for faker output
  -h, --help          Show this help message
`);
}

async function runWatchMode(options: CliOptions): Promise<void> {
  const watchers = new Map<string, fs.FSWatcher>();
  let timer: NodeJS.Timeout | undefined;
  let running = false;
  let queued = false;

  const closeWatchers = (): void => {
    for (const watcher of watchers.values()) {
      watcher.close();
    }
    watchers.clear();
  };

  const syncWatchers = (files: string[]): void => {
    const next = new Set(files.map((file) => path.resolve(file)));

    for (const existingFile of [...watchers.keys()]) {
      if (!next.has(existingFile)) {
        watchers.get(existingFile)?.close();
        watchers.delete(existingFile);
      }
    }

    for (const file of next) {
      if (watchers.has(file)) {
        continue;
      }

      const watcher = fs.watch(file, () => {
        scheduleRun();
      });
      watchers.set(file, watcher);
    }
  };

  const run = async (): Promise<void> => {
    if (running) {
      queued = true;
      return;
    }

    running = true;
    try {
      const result = await generateDataFile({
        input: options.input,
        cwd: options.cwd,
        write: true,
        failOnWarn: options.failOnWarn,
        deepMerge: options.deepMerge,
        include: options.include,
        exclude: options.exclude,
        fakerOverrides: options.fakerOverrides,
      });

      for (const warning of result.warnings) {
        console.warn(`[gen-gen] ${warning}`);
      }

      const verb = result.changed ? "Generated" : "No changes for";
      console.log(`[gen-gen] ${verb} ${path.relative(process.cwd(), result.inputPath)}`);
      syncWatchers(result.watchedFiles);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[gen-gen] ${message}`);
    } finally {
      running = false;
      if (queued) {
        queued = false;
        scheduleRun();
      }
    }
  };

  const scheduleRun = (): void => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      void run();
    }, 80);
  };

  process.on("SIGINT", () => {
    closeWatchers();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    closeWatchers();
    process.exit(0);
  });

  console.log("[gen-gen] Watching for changes...");
  await run();
  await new Promise(() => {});
}

function parseListArg(raw: string | undefined): string[] {
  if (!raw) {
    throw new Error("Expected a comma-separated value after list argument.");
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function parseOverrideArg(raw: string | undefined): { key: string; expression: string } {
  if (!raw) {
    throw new Error("Expected key=expression after --faker-override.");
  }

  const separatorIndex = raw.indexOf("=");
  if (separatorIndex <= 0) {
    throw new Error("Expected --faker-override in the format key=expression.");
  }

  const key = raw.slice(0, separatorIndex).trim();
  const expression = raw.slice(separatorIndex + 1).trim();
  if (!key || !expression) {
    throw new Error("Expected non-empty key and expression for --faker-override.");
  }

  return {key, expression};
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[gen-gen] ${message}`);
  process.exit(1);
});
