import {describe, expect, test} from "bun:test";
import path from "node:path";

import {createWatchModeRuntime, type CliOptions} from "../src/cli-core.js";
import type {GenerateResult} from "../src/generator.js";

interface WatchHandle {
  close(): void;
}

function baseOptions(): CliOptions {
  return {
    check: false,
    dryRun: false,
    failOnWarn: false,
    watch: true,
    deepMerge: false,
    include: [],
    exclude: [],
    fakerOverrides: {},
  };
}

function createResult(inputPath: string, watchedFiles: string[]): GenerateResult {
  return {
    inputPath,
    changed: true,
    content: "",
    watchedFiles,
    warnings: [],
  };
}

describe("watch mode runtime", () => {
  test("debounces repeated file events into one generation run", async () => {
    let generateCalls = 0;
    const watchListeners = new Map<string, () => void>();
    const closed = new Set<string>();

    const runtime = createWatchModeRuntime(baseOptions(), {
      watch(file, listener): WatchHandle {
        watchListeners.set(path.resolve(file), listener);
        return {
          close() {
            closed.add(path.resolve(file));
          },
        };
      },
      async generate() {
        generateCalls += 1;
        return createResult("/tmp/data-gen.ts", ["/tmp/a.ts"]);
      },
      log() {},
      warn() {},
      error() {},
      setTimer(callback, delayMs) {
        return setTimeout(callback, delayMs);
      },
      clearTimer(timer) {
        clearTimeout(timer);
      },
    });

    await runtime.run();
    const listener = watchListeners.get(path.resolve("/tmp/a.ts"));
    expect(listener).toBeDefined();

    listener?.();
    listener?.();
    listener?.();

    await Bun.sleep(140);
    expect(generateCalls).toBe(2);
    expect(closed.has(path.resolve("/tmp/a.ts"))).toBeFalse();
    runtime.closeWatchers();
  });

  test("refreshes watchers when watched file set changes", async () => {
    const watchListeners = new Map<string, () => void>();
    const closed = new Set<string>();
    let runIndex = 0;

    const runtime = createWatchModeRuntime(baseOptions(), {
      watch(file, listener): WatchHandle {
        watchListeners.set(path.resolve(file), listener);
        return {
          close() {
            closed.add(path.resolve(file));
            watchListeners.delete(path.resolve(file));
          },
        };
      },
      async generate() {
        runIndex += 1;
        return runIndex === 1
          ? createResult("/tmp/data-gen.ts", ["/tmp/a.ts"])
          : createResult("/tmp/data-gen.ts", ["/tmp/b.ts"]);
      },
      log() {},
      warn() {},
      error() {},
      setTimer(callback, delayMs) {
        return setTimeout(callback, delayMs);
      },
      clearTimer(timer) {
        clearTimeout(timer);
      },
    });

    await runtime.run();
    expect(watchListeners.has(path.resolve("/tmp/a.ts"))).toBeTrue();

    watchListeners.get(path.resolve("/tmp/a.ts"))?.();
    await Bun.sleep(140);

    expect(closed.has(path.resolve("/tmp/a.ts"))).toBeTrue();
    expect(watchListeners.has(path.resolve("/tmp/b.ts"))).toBeTrue();
    runtime.closeWatchers();
  });

  test("queues one rerun when changes happen during active generation", async () => {
    let resolveFirstRun: (() => void) | undefined;
    let runCount = 0;
    const watchListeners = new Map<string, () => void>();

    const runtime = createWatchModeRuntime(baseOptions(), {
      watch(file, listener): WatchHandle {
        watchListeners.set(path.resolve(file), listener);
        return {
          close() {},
        };
      },
      async generate() {
        runCount += 1;
        if (runCount === 1) {
          await new Promise<void>((resolve) => {
            resolveFirstRun = resolve;
          });
        }
        return createResult("/tmp/data-gen.ts", ["/tmp/a.ts"]);
      },
      log() {},
      warn() {},
      error() {},
      setTimer(callback, delayMs) {
        return setTimeout(callback, delayMs);
      },
      clearTimer(timer) {
        clearTimeout(timer);
      },
    });

    const firstRunPromise = runtime.run();
    await Bun.sleep(20);
    runtime.scheduleRun();
    resolveFirstRun?.();
    await firstRunPromise;
    await Bun.sleep(140);

    expect(runCount).toBe(2);
    runtime.closeWatchers();
  });

  test("watches faker strategy module file in watch mode", async () => {
    const watchedFiles = new Set<string>();
    const runtime = createWatchModeRuntime(
      {
        ...baseOptions(),
        cwd: "/tmp/project",
        fakerStrategyModule: "./strategy.ts",
      },
      {
        watch(file, listener): WatchHandle {
          watchedFiles.add(path.resolve(file));
          return {
            close() {},
          };
        },
        async generate() {
          return createResult("/tmp/data-gen.ts", ["/tmp/project/example.ts"]);
        },
        log() {},
        warn() {},
        error() {},
        setTimer(callback, delayMs) {
          return setTimeout(callback, delayMs);
        },
        clearTimer(timer) {
          clearTimeout(timer);
        },
      },
    );

    await runtime.run();
    expect(watchedFiles.has(path.resolve("/tmp/project/example.ts"))).toBeTrue();
    expect(watchedFiles.has(path.resolve("/tmp/project/strategy.ts"))).toBeTrue();
    runtime.closeWatchers();
  });
});
