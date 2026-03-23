import fs from "node:fs";
import path from "node:path";
import {
  generateDataFile,
  type GenerateResult,
} from "./generator.js";

export interface CliOptions {
  input?: string;
  cwd?: string;
  check: boolean;
  dryRun: boolean;
  failOnWarn: boolean;
  watch: boolean;
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
  }): Promise<GenerateResult>;
  log(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  setTimer(callback: () => void, delayMs: number): ReturnType<typeof setTimeout>;
  clearTimer(timer: ReturnType<typeof setTimeout>): void;
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
    watch: false,
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
  -w, --watch         Regenerate on file changes
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
      const result = await deps.generate({
        input: options.input,
        cwd: options.cwd,
        write: true,
        failOnWarn: options.failOnWarn,
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
  const runtime = createWatchModeRuntime(options, defaultWatchDeps);

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

  const result = await generateDataFile({
    input: options.input,
    cwd: options.cwd,
    write: !options.dryRun && !options.check,
    failOnWarn: options.failOnWarn,
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
