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
});
