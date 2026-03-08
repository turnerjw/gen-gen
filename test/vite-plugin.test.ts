import {describe, expect, test} from "bun:test";
import path from "node:path";

import {createGenGenPlugin} from "../src/vite-plugin.js";
import type {GenerateResult} from "../src/generator.js";

function createResult(overrides: Partial<GenerateResult> = {}): GenerateResult {
  return {
    inputPath: "/tmp/data-gen.ts",
    changed: false,
    content: "",
    watchedFiles: [],
    warnings: [],
    ...overrides,
  };
}

describe("vite plugin", () => {
  test("buildStart generates and registers watch files", async () => {
    const generatedOptions: Array<Record<string, unknown>> = [];
    const watched: string[] = [];

    const plugin = createGenGenPlugin(
      {
        input: "example/data-gen.ts",
        failOnWarn: true,
        propertyPolicy: {
          optionalProperties: "omit",
          readonlyProperties: "warn",
          indexSignatures: "warn",
        },
        typeMappingPresets: ["common"],
        include: ["User"],
        fakerStrategy: () => "faker.string.uuid()",
      },
      {
        async generate(options) {
          generatedOptions.push(options as Record<string, unknown>);
          return createResult({
            watchedFiles: ["/tmp/a.ts", "/tmp/b.ts"],
            warnings: ["warn 1"],
          });
        },
        warn() {},
        error() {},
      },
    );

    plugin.configResolved({root: "/workspace/project"});
    await plugin.buildStart.call({
      addWatchFile(file: string) {
        watched.push(file);
      },
    });

    expect(watched).toEqual(["/tmp/a.ts", "/tmp/b.ts"]);
    expect(generatedOptions).toHaveLength(1);
    expect(generatedOptions[0]?.cwd).toBe("/workspace/project");
    expect(generatedOptions[0]?.write).toBeTrue();
    expect(generatedOptions[0]?.failOnWarn).toBeTrue();
    expect(generatedOptions[0]?.propertyPolicy).toEqual({
      optionalProperties: "omit",
      readonlyProperties: "warn",
      indexSignatures: "warn",
    });
    expect(generatedOptions[0]?.typeMappingPresets).toEqual(["common"]);
    expect(generatedOptions[0]?.include).toEqual(["User"]);
    expect(typeof generatedOptions[0]?.fakerStrategy).toBe("function");
  });

  test("configureServer regenerates and reloads only for watched changed files", async () => {
    const reloads: Array<{type: "full-reload"}> = [];
    const listeners: Array<(file: string) => void> = [];
    let generateCall = 0;

    const plugin = createGenGenPlugin(
      {},
      {
        async generate() {
          generateCall += 1;
          if (generateCall === 1) {
            return createResult({watchedFiles: ["/tmp/a.ts"]});
          }
          return createResult({watchedFiles: ["/tmp/a.ts"], changed: true});
        },
        warn() {},
        error() {},
      },
    );

    plugin.configResolved({root: "/workspace/project"});
    await plugin.buildStart.call({
      addWatchFile() {},
    });

    plugin.configureServer({
      watcher: {
        on(_event, listener) {
          listeners.push(listener);
        },
      },
      ws: {
        send(payload) {
          reloads.push(payload);
        },
      },
    });

    const onChange = listeners[0];
    expect(onChange).toBeDefined();

    await onChange?.("/tmp/not-watched.ts");
    expect(generateCall).toBe(1);
    expect(reloads).toHaveLength(0);

    await onChange?.(path.resolve("/tmp/a.ts"));
    expect(generateCall).toBe(2);
    expect(reloads).toEqual([{type: "full-reload"}]);
  });

  test("configureServer logs error when generation fails during watch", async () => {
    const listeners: Array<(file: string) => void> = [];
    const errors: Array<{message: string; error: unknown}> = [];
    let generateCall = 0;

    const plugin = createGenGenPlugin(
      {},
      {
        async generate() {
          generateCall += 1;
          if (generateCall === 1) {
            return createResult({watchedFiles: ["/tmp/a.ts"]});
          }
          throw new Error("boom");
        },
        warn() {},
        error(message, error) {
          errors.push({message, error});
        },
      },
    );

    plugin.configResolved({root: "/workspace/project"});
    await plugin.buildStart.call({
      addWatchFile() {},
    });

    plugin.configureServer({
      watcher: {
        on(_event, listener) {
          listeners.push(listener);
        },
      },
      ws: {
        send() {},
      },
    });

    await listeners[0]?.("/tmp/a.ts");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toBe("[gen-gen] generation failed during watch");
  });
});
