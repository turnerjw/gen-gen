import fs from "node:fs";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {
  generateDataFile,
  type FakerStrategyHook,
  type GenerateResult,
  type PropertyPolicy,
  type TypeMappingPresetName,
} from "./generator.js";

export interface CliOptions {
  input?: string;
  cwd?: string;
  check: boolean;
  dryRun: boolean;
  failOnWarn: boolean;
  optionalProperties: PropertyPolicy["optionalProperties"];
  indexSignatures: PropertyPolicy["indexSignatures"];
  fakerStrategyModule?: string;
  fakerStrategy?: FakerStrategyHook;
  typeMappingPresets: TypeMappingPresetName[];
  watch: boolean;
  deepMerge: boolean;
  include: string[];
  exclude: string[];
  fakerOverrides: Record<string, string>;
}

interface WatchHandle {
  close(): void;
}

interface WatchDeps {
  watch(file: string, listener: () => void): WatchHandle;
  generate(options: {
    input?: string;
    cwd?: string;
    write: boolean;
    failOnWarn: boolean;
    propertyPolicy: Partial<PropertyPolicy>;
    fakerStrategy?: FakerStrategyHook;
    typeMappingPresets: TypeMappingPresetName[];
    deepMerge: boolean;
    include: string[];
    exclude: string[];
    fakerOverrides: Record<string, string>;
  }): Promise<GenerateResult>;
  log(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  setTimer(callback: () => void, delayMs: number): ReturnType<typeof setTimeout>;
  clearTimer(timer: ReturnType<typeof setTimeout>): void;
  resolveFakerStrategy?(options: CliOptions): Promise<FakerStrategyHook | undefined>;
}

const defaultWatchDeps: WatchDeps = {
  watch(file, listener) {
    return fs.watch(file, listener);
  },
  generate(options) {
    return generateDataFile(options);
  },
  log(message) {
    console.log(message);
  },
  warn(message) {
    console.warn(message);
  },
  error(message) {
    console.error(message);
  },
  setTimer(callback, delayMs) {
    return setTimeout(callback, delayMs);
  },
  clearTimer(timer) {
    clearTimeout(timer);
  },
};

export function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    check: false,
    dryRun: false,
    failOnWarn: false,
    optionalProperties: "include",
    indexSignatures: "ignore",
    typeMappingPresets: [],
    watch: false,
    deepMerge: true,
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

    if (arg === "--optional-properties") {
      const value = args[i + 1];
      if (value !== "include" && value !== "omit") {
        throw new Error("Expected --optional-properties to be one of: include, omit.");
      }
      options.optionalProperties = value;
      i += 1;
      continue;
    }

    if (arg === "--index-signatures") {
      const value = args[i + 1];
      if (value !== "ignore" && value !== "warn") {
        throw new Error("Expected --index-signatures to be one of: ignore, warn.");
      }
      options.indexSignatures = value;
      i += 1;
      continue;
    }

    if (arg === "--faker-strategy") {
      const value = args[i + 1];
      if (!value) {
        throw new Error("Expected a module path after --faker-strategy.");
      }
      options.fakerStrategyModule = value;
      i += 1;
      continue;
    }

    if (arg === "--preset") {
      const raw = args[i + 1];
      if (!raw) {
        throw new Error("Expected one or more preset names after --preset.");
      }
      const parsed = parsePresetArg(raw);
      options.typeMappingPresets.push(...parsed);
      i += 1;
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

export function printHelp(): void {
  console.log(`gen-gen

Usage:
  gen-gen [options]

Options:
  -i, --input <path>  Path to generator source file (default: data-gen.ts)
      --cwd <path>    Working directory to resolve input from
      --check         Exit 1 if generated section is out of date
      --dry-run       Print resulting file content to stdout
      --fail-on-warn  Exit with error if generation emits warnings
      --optional-properties <include|omit>
                     Include or omit optional properties in generated base objects
      --index-signatures <ignore|warn>
                     Ignore or warn when index signatures are not materialized
      --faker-strategy <path>
                     Module path exporting faker strategy function (default export or named \`fakerStrategy\`)
      --preset <name[,name...]>
                     Type-mapping preset(s): common, commerce
  -w, --watch         Regenerate on file changes
      --deep-merge    Deep merge overrides instead of shallow spread
      --include       Comma-separated generator/type filters to include
      --exclude       Comma-separated generator/type filters to exclude
      --faker-override  key=expression override for faker output
  -h, --help          Show this help message
`);
}

export function createWatchModeRuntime(
  options: CliOptions,
  deps: WatchDeps = defaultWatchDeps,
): {
  run(): Promise<void>;
  scheduleRun(): void;
  closeWatchers(): void;
} {
  const watchers = new Map<string, WatchHandle>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let queued = false;
  let runCount = 0;

  const closeWatchers = (): void => {
    if (timer) {
      deps.clearTimer(timer);
      timer = undefined;
    }

    for (const watcher of watchers.values()) {
      watcher.close();
    }
    watchers.clear();
  };

  const scheduleRun = (): void => {
    if (timer) {
      deps.clearTimer(timer);
    }

    timer = deps.setTimer(() => {
      void run();
    }, 80);
  };

  const triggerRun = (file?: string): void => {
    if (process.env.GEN_GEN_WATCH_DIAGNOSTICS === "1" && file) {
      deps.log(`[gen-gen] watch trigger: ${path.relative(process.cwd(), path.resolve(file))}`);
    }
    scheduleRun();
  };

  const syncWatchers = (files: string[]): void => {
    const next = new Set(files.map((file) => path.resolve(file)));
    if (options.fakerStrategyModule) {
      const baseCwd = options.cwd ?? process.cwd();
      next.add(path.resolve(baseCwd, options.fakerStrategyModule));
    }

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

      const watcher = deps.watch(file, () => {
        triggerRun(file);
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
    runCount += 1;
    const startedAt = Date.now();
    try {
      const fakerStrategy = deps.resolveFakerStrategy ? await deps.resolveFakerStrategy(options) : options.fakerStrategy;
      const result = await deps.generate({
        input: options.input,
        cwd: options.cwd,
        write: true,
        failOnWarn: options.failOnWarn,
        propertyPolicy: {
          optionalProperties: options.optionalProperties,
          indexSignatures: options.indexSignatures,
        },
        fakerStrategy,
        typeMappingPresets: options.typeMappingPresets,
        deepMerge: options.deepMerge,
        include: options.include,
        exclude: options.exclude,
        fakerOverrides: options.fakerOverrides,
      });

      for (const warning of result.warnings) {
        deps.warn(`[gen-gen] ${warning}`);
      }

      const verb = result.changed ? "Generated" : "No changes for";
      deps.log(`[gen-gen] ${verb} ${path.relative(process.cwd(), result.inputPath)}`);
      if (process.env.GEN_GEN_WATCH_DIAGNOSTICS === "1") {
        const elapsedMs = Date.now() - startedAt;
        deps.log(
          `[gen-gen] watch run #${runCount} metrics: ${elapsedMs}ms, changed=${result.changed}, warnings=${result.warnings.length}, watched=${result.watchedFiles.length}`,
        );
      }
      syncWatchers(result.watchedFiles);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      deps.error(`[gen-gen] ${message}`);
    } finally {
      running = false;
      if (queued) {
        queued = false;
        scheduleRun();
      }
    }
  };

  return {
    run,
    scheduleRun: () => triggerRun(),
    closeWatchers,
  };
}

export async function runWatchMode(options: CliOptions): Promise<void> {
  const runtime = createWatchModeRuntime(options, {
    ...defaultWatchDeps,
    async resolveFakerStrategy(currentOptions) {
      return loadFakerStrategyFromModule(currentOptions, true);
    },
  });

  process.on("SIGINT", () => {
    runtime.closeWatchers();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    runtime.closeWatchers();
    process.exit(0);
  });

  console.log("[gen-gen] Watching for changes...");
  if (process.env.GEN_GEN_WATCH_DIAGNOSTICS === "1") {
    console.log("[gen-gen] Watch diagnostics enabled.");
  }
  await runtime.run();
  await new Promise(() => {});
}

export async function main(args = process.argv.slice(2)): Promise<void> {
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

  const fakerStrategy = await loadFakerStrategyFromModule(options, false);

  const result = await generateDataFile({
    input: options.input,
    cwd: options.cwd,
    write: !options.dryRun && !options.check,
    failOnWarn: options.failOnWarn,
    propertyPolicy: {
      optionalProperties: options.optionalProperties,
      indexSignatures: options.indexSignatures,
    },
    fakerStrategy,
    typeMappingPresets: options.typeMappingPresets,
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

function parsePresetArg(raw: string): TypeMappingPresetName[] {
  const values = raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  if (values.length === 0) {
    throw new Error("Expected one or more preset names after --preset.");
  }

  const allowed = new Set<TypeMappingPresetName>(["common", "commerce"]);
  const invalid = values.filter((value): value is string => !allowed.has(value as TypeMappingPresetName));
  if (invalid.length > 0) {
    throw new Error(`Unknown preset(s): ${invalid.join(", ")}. Allowed presets: common, commerce.`);
  }

  return [...new Set(values)] as TypeMappingPresetName[];
}

async function loadFakerStrategyFromModule(
  options: CliOptions,
  cacheBust: boolean,
): Promise<FakerStrategyHook | undefined> {
  if (!options.fakerStrategyModule) {
    return options.fakerStrategy;
  }

  const baseCwd = options.cwd ?? process.cwd();
  const modulePath = path.resolve(baseCwd, options.fakerStrategyModule);
  const moduleUrl = pathToFileURL(modulePath).href;
  const imported = await import(cacheBust ? `${moduleUrl}?t=${Date.now()}` : moduleUrl);
  const candidate = (imported.default ?? imported.fakerStrategy) as unknown;
  if (typeof candidate !== "function") {
    throw new Error(
      `Invalid faker strategy module: ${options.fakerStrategyModule}. ` +
        "Expected a default export or named export `fakerStrategy` function.",
    );
  }

  return candidate as FakerStrategyHook;
}
