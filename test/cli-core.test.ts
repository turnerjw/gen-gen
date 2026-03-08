import {describe, expect, test} from "bun:test";

import {parseArgs} from "../src/cli-core.js";

describe("cli-core parseArgs", () => {
  test("parses --faker-strategy module path", () => {
    const options = parseArgs(["--input", "example/basic/data-gen.ts", "--faker-strategy", "./strategy.ts"]);
    expect(options.input).toBe("example/basic/data-gen.ts");
    expect(options.fakerStrategyModule).toBe("./strategy.ts");
  });

  test("throws when --faker-strategy path is missing", () => {
    expect(() => parseArgs(["--faker-strategy"])).toThrow("Expected a module path after --faker-strategy.");
  });

  test("parses --preset values", () => {
    const options = parseArgs(["--preset", "common,commerce", "--preset", "common"]);
    expect(options.typeMappingPresets).toEqual(["common", "commerce", "common"]);
  });

  test("throws for unknown preset names", () => {
    expect(() => parseArgs(["--preset", "unknown"])).toThrow("Unknown preset(s): unknown. Allowed presets: common, commerce.");
  });

  test("parses --watch-diagnostics", () => {
    const options = parseArgs(["--watch", "--watch-diagnostics"]);
    expect(options.watch).toBeTrue();
    expect(options.watchDiagnostics).toBeTrue();
  });
});
