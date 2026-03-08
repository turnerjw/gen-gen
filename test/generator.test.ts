import {afterEach, describe, expect, test} from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import {pathToFileURL} from "node:url";

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
  const tempRoot = path.join(process.cwd(), ".tmp");
  await fs.mkdir(tempRoot, {recursive: true});
  const root = await fs.mkdtemp(path.join(tempRoot, "gen-gen-test-"));
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
    expect(result.content).toContain("function __genGenCreateHelper<T extends object>(");
    expect(result.content).toContain("helperCache: WeakMap<object, unknown> = new WeakMap()");
    expect(result.content).toContain("const cached = helperCache.get(base as object);");
    expect(result.content).toContain("export type GenerateDeepCallbackParam = (helpers: GenGenHelpers<Deep>) => Partial<Deep>;");
    expect(result.content).toContain("return generate(overrides);");
    expect(result.content).toContain("f: faker.word.noun()");
    expect(result.content).toContain("g: faker.number.int({ min: 1, max: 1000 })");
  });

  test("deepMerge mode preserves nested sibling values at runtime", async () => {
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

    const result = await generateDataFile({cwd, write: true, deepMerge: true});
    expect(result.content).toContain("function __genGenMergeDeep<T>(base: T, overrides: Partial<T> | undefined): T {");
    expect(result.content).toContain("return __genGenMergeDeep(base, resolvedOverrides);");

    const moduleUrl = `${pathToFileURL(path.join(cwd, "data-gen.ts")).href}?t=${Date.now()}`;
    const generatedModule = (await import(moduleUrl)) as {
      generateDeep(overrides?: unknown): {
        a: string;
        b: {c: number; e: {f: string; g: number}};
      };
    };

    const value = generatedModule.generateDeep({
      b: {
        e: {
          f: "override",
        },
      },
    });

    expect(value.b.c).toEqual(expect.any(Number));
    expect(value.b.e.f).toBe("override");
    expect(value.b.e.g).toEqual(expect.any(Number));
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

  test("generates literal unions with faker.helpers.arrayElement", async () => {
    const cwd = await createFixture({
      "types.ts": `
export type LiteralUnions = {
  status: "idle" | "loading" | "error";
  rating: 1 | 2 | 3;
  flag: true | false;
};
`,
      "data-gen.ts": `
import type { LiteralUnions } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const result = await generateDataFile({cwd, write: false});

    expect(result.content).toContain('status: faker.helpers.arrayElement(["idle", "loading", "error"])');
    expect(result.content).toContain("rating: faker.helpers.arrayElement([1, 2, 3])");
    expect(result.content).toContain("flag: faker.datatype.boolean()");
  });

  test("generates discriminated unions by selecting an object branch", async () => {
    const cwd = await createFixture({
      "types.ts": `
export type EventPayload =
  | { kind: "user"; userId: string; admin: boolean }
  | { kind: "order"; orderId: number; total: number };

export type UnionWrapper = {
  payload: EventPayload;
};
`,
      "data-gen.ts": `
import type { UnionWrapper } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const result = await generateDataFile({cwd, write: false});

    expect(result.content).toContain("payload: faker.helpers.arrayElement([");
    expect(result.content).toContain('kind: "user"');
    expect(result.content).toContain('kind: "order"');
    expect(result.content).toContain("userId: faker.word.noun()");
    expect(result.content).toContain("orderId: faker.number.int({ min: 1, max: 1000 })");
  });

  test("applies include/exclude filters from GenerateOptions", async () => {
    const cwd = await createFixture({
      "types.ts": `
export type A = { a: string };
export type B = { b: number };
export type C = { c: boolean };
`,
      "data-gen.ts": `
import type { A, B, C } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const result = await generateDataFile({
      cwd,
      write: false,
      include: ["A", "generateB"],
      exclude: ["B"],
    });

    expect(result.content).toContain("export function generateA(");
    expect(result.content).not.toContain("export function generateB(");
    expect(result.content).not.toContain("export function generateC(");
  });

  test("applies IncludeGenerators and ExcludeGenerators aliases in source file", async () => {
    const cwd = await createFixture({
      "types.ts": `
export type A = { a: string };
export type B = { b: number };
export type Wrapper<T> = { value: T };
`,
      "data-gen.ts": `
import type { A, B, Wrapper } from "./types";

type ConcreteGenerics = [Wrapper<A>];
type IncludeGenerators = [A, Wrapper<A>];
type ExcludeGenerators = [Wrapper<A>];

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const result = await generateDataFile({cwd, write: false});

    expect(result.content).toContain("export function generateA(");
    expect(result.content).not.toContain("export function generateB(");
    expect(result.content).not.toContain("export function generateAWrapper(");
  });

  test("applies FakerOverrides from source file for path and type keys", async () => {
    const cwd = await createFixture({
      "types.ts": `
export type UserId = string;
export type User = {
  id: UserId;
  email: string;
  profile: {
    locale: string;
  };
};
`,
      "data-gen.ts": `
import type { User, UserId } from "./types";

const FakerOverrides = {
  email: () => faker.internet.email(),
  "User.id": () => faker.string.uuid(),
  "User.profile.locale": () => faker.helpers.arrayElement(["en-CA", "fr-CA"]),
} as const;

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const result = await generateDataFile({cwd, write: false});

    expect(result.warnings).toContain('Skipped imported type "UserId": only object types are supported for generators.');
    expect(result.content).toContain("id: faker.string.uuid()");
    expect(result.content).toContain("email: faker.internet.email()");
    expect(result.content).toContain("locale: faker.helpers.arrayElement([\"en-CA\", \"fr-CA\"])");
    expect(result.content).toContain("export function generateUser(");
    expect(result.content).not.toContain("export function generateUserId(");
  });

  test("applies FakerOverrides passed via GenerateOptions", async () => {
    const cwd = await createFixture({
      "types.ts": `
export type User = {
  name: string;
  age: number;
};
`,
      "data-gen.ts": `
import type { User } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const result = await generateDataFile({
      cwd,
      write: false,
      fakerOverrides: {
        name: (faker) => faker.person.firstName(),
        age: "42",
      },
    });

    expect(result.content).toContain("name: ((faker) => faker.person.firstName())(faker)");
    expect(result.content).toContain("age: 42");
  });

  test("applies fakerStrategy when no direct FakerOverrides match", async () => {
    const cwd = await createFixture({
      "types.ts": `
export type User = {
  id: string;
  email: string;
  age: number;
};
`,
      "data-gen.ts": `
import type { User } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const result = await generateDataFile({
      cwd,
      write: false,
      fakerStrategy(context) {
        if (context.rootTypeText === "User" && context.path === "id") {
          return {expression: "faker.string.uuid()", invokeMode: "raw"};
        }
        if (context.path === "email") {
          return (faker) => faker.internet.email();
        }
        return undefined;
      },
    });

    expect(result.content).toContain("id: faker.string.uuid()");
    expect(result.content).toContain("email: ((faker) => faker.internet.email())(faker)");
    expect(result.content).toContain("age: faker.number.int({ min: 1, max: 1000 })");
  });

  test("prioritizes FakerOverrides over fakerStrategy", async () => {
    const cwd = await createFixture({
      "types.ts": `
export type User = {
  id: string;
  email: string;
};
`,
      "data-gen.ts": `
import type { User } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const result = await generateDataFile({
      cwd,
      write: false,
      fakerOverrides: {
        "User.id": "faker.string.alphanumeric(12)",
      },
      fakerStrategy(context) {
        if (context.path === "id") {
          return {expression: "faker.string.uuid()", invokeMode: "raw"};
        }
        return undefined;
      },
    });

    expect(result.content).toContain("id: faker.string.alphanumeric(12)");
    expect(result.content).not.toContain("id: faker.string.uuid()");
  });

  test("applies common preset mappings when enabled", async () => {
    const cwd = await createFixture({
      "types.ts": `
export type User = {
  id: string;
  email: string;
  homepage: string;
  createdAt: string;
  updatedAt: Date;
  note: string;
};
`,
      "data-gen.ts": `
import type { User } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const result = await generateDataFile({
      cwd,
      write: false,
      typeMappingPresets: ["common"],
    });

    expect(result.content).toContain("id: faker.string.uuid()");
    expect(result.content).toContain("email: faker.internet.email()");
    expect(result.content).toContain("homepage: faker.internet.url()");
    expect(result.content).toContain("createdAt: faker.date.recent().toISOString()");
    expect(result.content).toContain("updatedAt: faker.date.recent()");
    expect(result.content).toContain("note: faker.word.noun()");
  });

  test("allows fakerStrategy to override preset mapping", async () => {
    const cwd = await createFixture({
      "types.ts": `
export type User = {
  email: string;
};
`,
      "data-gen.ts": `
import type { User } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const result = await generateDataFile({
      cwd,
      write: false,
      typeMappingPresets: ["common"],
      fakerStrategy(context) {
        if (context.path === "email") {
          return "faker.internet.exampleEmail()";
        }
        return undefined;
      },
    });

    expect(result.content).toContain("email: faker.internet.exampleEmail()");
    expect(result.content).not.toContain("email: faker.internet.email()");
  });

  test("warns for unmatched include/exclude filters and unused faker overrides", async () => {
    const cwd = await createFixture({
      "types.ts": `
export type User = {
  name: string;
};
`,
      "data-gen.ts": `
import type { User } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const result = await generateDataFile({
      cwd,
      write: false,
      include: ["User", "MissingType"],
      exclude: ["AlsoMissing"],
      fakerOverrides: {
        "Missing.path": "() => faker.word.noun()",
      },
    });

    expect(result.warnings).toContain("Unmatched include filters: MissingType");
    expect(result.warnings).toContain("Unmatched exclude filters: AlsoMissing");
    expect(result.warnings).toContain("Unused faker overrides: Missing.path");
    expect(result.content).toContain("export function generateUser(");
  });

  test("failOnWarn throws when warnings are emitted", async () => {
    const cwd = await createFixture({
      "types.ts": `
export type User = { name: string };
`,
      "data-gen.ts": `
import type { User } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    await expect(
      generateDataFile({
        cwd,
        write: false,
        failOnWarn: true,
        include: ["MissingType"],
      }),
    ).rejects.toThrow("Generation failed due to warnings:");
  });

  test("failOnWarn does not throw when no warnings are emitted", async () => {
    const cwd = await createFixture({
      "types.ts": `
export type User = { name: string };
`,
      "data-gen.ts": `
import type { User } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const result = await generateDataFile({
      cwd,
      write: false,
      failOnWarn: true,
    });

    expect(result.warnings).toHaveLength(0);
    expect(result.content).toContain("export function generateUser(");
  });

  test("skips type generators marked with @gen-gen-ignore", async () => {
    const cwd = await createFixture({
      "types.ts": `
/** @gen-gen-ignore */
export type InternalOnly = { id: string };
export type PublicType = { name: string };
`,
      "data-gen.ts": `
import type { InternalOnly, PublicType } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const result = await generateDataFile({cwd, write: false});

    expect(result.warnings).toContain('Skipped imported type "InternalOnly": marked with @gen-gen-ignore.');
    expect(result.content).not.toContain("export function generateInternalOnly(");
    expect(result.content).toContain("export function generatePublicType(");
  });

  test("uses placeholder values for properties marked with @gen-gen-ignore", async () => {
    const cwd = await createFixture({
      "types.ts": `
export type User = {
  id: string;
  /** @gen-gen-ignore */
  profile: {
    locale: string;
  };
  email: string;
};
`,
      "data-gen.ts": `
import type { User } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const result = await generateDataFile({cwd, write: false});

    expect(result.content).toContain("profile: {} as");
    expect(result.content).toContain("email: faker.word.noun()");
    expect(result.content).toContain("id: faker.word.noun()");
    expect(result.content).not.toContain("locale: faker");
  });

  test("omits optional properties when optionalProperties policy is omit", async () => {
    const cwd = await createFixture({
      "types.ts": `
export type Account = {
  id: string;
  email?: string;
};
`,
      "data-gen.ts": `
import type { Account } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const result = await generateDataFile({
      cwd,
      write: false,
      propertyPolicy: {
        optionalProperties: "omit",
      },
    });

    expect(result.content).toContain("id: faker.word.noun()");
    expect(result.content).not.toContain("email:");
  });

  test("emits warnings for readonly properties and index signatures by policy", async () => {
    const cwd = await createFixture({
      "types.ts": `
export type Config = {
  readonly id: string;
  values: {
    [key: string]: number;
  };
};
`,
      "data-gen.ts": `
import type { Config } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const result = await generateDataFile({
      cwd,
      write: false,
      propertyPolicy: {
        readonlyProperties: "warn",
        indexSignatures: "warn",
      },
    });

    expect(result.warnings).toContain("Readonly property included by policy at Config.id.");
    expect(result.warnings).toContain("Index signature (string) not materialized at Config.values.");
    expect(result.content).toContain("id: faker.word.noun()");
  });

  test("generates branded/opaque primitive aliases using primitive faker values with casts", async () => {
    const cwd = await createFixture({
      "types.ts": `
export type UserId = string & { readonly __brand: "UserId" };
export type AmountCents = number & { readonly __brand: "AmountCents" };
export type Order = {
  id: UserId;
  total: AmountCents;
};
`,
      "data-gen.ts": `
import type { Order } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const result = await generateDataFile({cwd, write: false});

    expect(result.content).toContain("id: faker.word.noun() as");
    expect(result.content).toContain(".UserId");
    expect(result.content).toContain("total: faker.number.int({ min: 1, max: 1000 }) as");
    expect(result.content).toContain(".AmountCents");
  });

  test("generates string and numeric enums using explicit enum member values", async () => {
    const cwd = await createFixture({
      "types.ts": `
export enum Status {
  Draft = "draft",
  Active = "active",
  Closed = "closed",
}

export enum Priority {
  Low = 1,
  Medium,
  High = 10,
}

export type Ticket = {
  status: Status;
  priority: Priority;
};
`,
      "data-gen.ts": `
import type { Ticket } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const result = await generateDataFile({cwd, write: false});

    expect(result.content).toContain('status: faker.helpers.arrayElement(["draft", "active", "closed"]) as');
    expect(result.content).toContain(".Status");
    expect(result.content).toContain("priority: faker.helpers.arrayElement([1, 2, 10]) as");
    expect(result.content).toContain(".Priority");
  });

  test("formats nested object literals with depth-aware indentation", async () => {
    const cwd = await createFixture({
      "types.ts": `
export type Deep = {
  a: string;
  b: {
    c: number;
    e: {
      f: string;
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

    expect(result.content).toContain("    b: {");
    expect(result.content).toContain("      e: {");
    expect(result.content).toContain("        f: faker.word.noun()");
  });

  test("wraps inline object array item expressions in parentheses", async () => {
    const cwd = await createFixture({
      "types.ts": `
export type Wrapper = {
  items: {
    id: string;
    score: number;
  }[];
};
`,
      "data-gen.ts": `
import type { Wrapper } from "./types";

/**
 * Generated below - DO NOT EDIT
 */
`,
    });

    const result = await generateDataFile({cwd, write: false});

    expect(result.content).toContain("items: Array.from(");
    expect(result.content).toContain("() => ({");
  });
});
