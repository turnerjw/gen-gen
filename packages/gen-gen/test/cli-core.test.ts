import {describe, expect, test} from "bun:test";

import {parseArgs} from "../src/cli-core.js";

describe("cli-core parseArgs", () => {
  test("throws for removed --preset flag", () => {
    expect(() => parseArgs(["--preset", "common"])).toThrow("Unknown argument: --preset");
  });

  test("throws for unknown --watch-diagnostics flag", () => {
    expect(() => parseArgs(["--watch", "--watch-diagnostics"])).toThrow("Unknown argument: --watch-diagnostics");
  });

  test("throws for removed --faker-strategy flag", () => {
    expect(() => parseArgs(["--faker-strategy", "./strategy.ts"])).toThrow("Unknown argument: --faker-strategy");
  });

  test("throws for removed --deep-merge flag", () => {
    expect(() => parseArgs(["--deep-merge"])).toThrow("Unknown argument: --deep-merge");
  });

  test("throws for removed --include flag", () => {
    expect(() => parseArgs(["--include", "A,B"])).toThrow("Unknown argument: --include");
  });

  test("throws for removed --exclude flag", () => {
    expect(() => parseArgs(["--exclude", "C"])).toThrow("Unknown argument: --exclude");
  });

  test("throws for removed --faker-override flag", () => {
    expect(() => parseArgs(["--faker-override", "key=value"])).toThrow("Unknown argument: --faker-override");
  });
});
