import {afterEach, describe, expect, test} from "bun:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {generateDataFile} from "../src/generator.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map(async (dir) => {
      await fs.rm(dir, {recursive: true, force: true});
    }),
  );
});

async function createFixture(files: Record<string, string>): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "gen-gen-test-"));
  tempDirs.push(root);

  await Promise.all(
    Object.entries(files).map(async ([filePath, contents]) => {
      const absolutePath = path.join(root, filePath);
      await fs.mkdir(path.dirname(absolutePath), {recursive: true});
      await fs.writeFile(absolutePath, contents, "utf8");
    }),
  );

  return root;
}

describe("generateDataFile", () => {
  test("generates imported concrete types and concrete generic types", async () => {
    const cwd = await createFixture({
      "types.ts": `
export type Pokemon = { id: number; name: string; kind: string };
export type Party = { members: Pokemon[]; lead: Pokemon };
export type APIResponse<T> = { data: T; error?: string };
`,
      "data-gen.ts": `
import type { APIResponse, Party, Pokemon } from "./types";

 type ConcreteGenerics = [APIResponse<Pokemon>]

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const result = await generateDataFile({cwd, write: false});

    expect(result.changed).toBeTrue();
    expect(result.warnings).toEqual([
      'Skipped imported type "APIResponse": generic type requires ConcreteGenerics entry.',
    ]);
    expect(result.content).toContain("export function generatePokemon(");
    expect(result.content).toContain("export function generateParty(");
    expect(result.content).toContain("export function generatePokemonAPIResponse(");
    expect(result.content).toContain("members: Array.from(");
    expect(result.content).toContain("error: faker.datatype.boolean() ? faker.word.noun() : undefined");
  });

  test("supports recursive callback helpers for nested object overrides", async () => {
    const cwd = await createFixture({
      "types.ts": `
export type Deep = {
  a: string;
  b: {
    c: number;
    e: {
      f: string;
      g: number;
    };
  };
};
`,
      "data-gen.ts": `
import type { Deep } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const result = await generateDataFile({cwd, write: false});

    expect(result.content).toContain("type GenGenHelpers<T extends object>");
    expect(result.content).toContain("type GenGenOverrides<T extends object>");
    expect(result.content).toContain("function __genGenCreateHelper<T extends object>(base: T)");
    expect(result.content).toContain("export type GenerateDeepCallbackParam = (helpers: GenGenHelpers<Deep>) => Partial<Deep>;");
    expect(result.content).toContain("return generate(overrides);");
    expect(result.content).toContain("f: faker.word.noun()");
    expect(result.content).toContain("g: faker.number.int({ min: 1, max: 1000 })");
  });

  test("adds faker import when missing and does not duplicate it", async () => {
    const cwd = await createFixture({
      "types.ts": `export type A = { name: string };`,
      "data-gen.ts": `
import type { A } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const first = await generateDataFile({cwd, write: true});
    expect(first.changed).toBeTrue();

    const written = await fs.readFile(path.join(cwd, "data-gen.ts"), "utf8");
    expect((written.match(/@faker-js\/faker/g) ?? []).length).toBe(1);

    const second = await generateDataFile({cwd, write: true});
    const rewritten = await fs.readFile(path.join(cwd, "data-gen.ts"), "utf8");

    expect(second.changed).toBeFalse();
    expect((rewritten.match(/@faker-js\/faker/g) ?? []).length).toBe(1);
  });

  test("appends marker block when missing and replaces only generated section", async () => {
    const cwd = await createFixture({
      "types.ts": `export type A = { count: number };`,
      "data-gen.ts": `
import type { A } from "./types";

const keepMe = "before";
`,
    });

    const result = await generateDataFile({cwd, write: true});
    expect(result.changed).toBeTrue();

    const updated = await fs.readFile(path.join(cwd, "data-gen.ts"), "utf8");
    expect(updated).toContain("const keepMe = \"before\";");
    expect(updated).toContain("Generated below - DO NOT EDIT");
    expect(updated).toContain("export function generateA(");
  });

  test("write=false returns changed content but does not modify file", async () => {
    const cwd = await createFixture({
      "types.ts": `export type A = { id: number };`,
      "data-gen.ts": `
import type { A } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const filePath = path.join(cwd, "data-gen.ts");
    const before = await fs.readFile(filePath, "utf8");

    const result = await generateDataFile({cwd, write: false});
    const after = await fs.readFile(filePath, "utf8");

    expect(result.changed).toBeTrue();
    expect(before).toBe(after);
    expect(result.content).toContain("export function generateA(");
  });

  test("reports watched files and excludes declaration files", async () => {
    const cwd = await createFixture({
      "types.ts": `export type A = { n: number };`,
      "extra.d.ts": `declare const x: string;`,
      "data-gen.ts": `
import type { A } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const result = await generateDataFile({cwd, write: false});

    const watched = new Set(result.watchedFiles.map((file) => path.relative(cwd, file)));
    expect(watched.has("data-gen.ts")).toBeTrue();
    expect(watched.has("types.ts")).toBeTrue();
    expect(watched.has("extra.d.ts")).toBeFalse();
  });

  test("uses generic naming order for multiple type arguments", async () => {
    const cwd = await createFixture({
      "types.ts": `
export type A = { a: string };
export type B = { b: number };
export type C = { c: boolean };
export type Container<T1, T2, T3> = { one: T1; two: T2; three: T3 };
`,
      "data-gen.ts": `
import type { A, B, C, Container } from "./types";

type ConcreteGenerics = [Container<A, B, C>]

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const result = await generateDataFile({cwd, write: false});

    expect(result.content).toContain("export function generateABCContainer(");
    expect(result.content).toContain("Partial<Container<A, B, C>>");
  });
});
