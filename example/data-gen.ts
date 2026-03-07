import type {UnnamedNestedExample} from "./types";

import {faker} from "@faker-js/faker";

/**
 * Add concrete generics here to generate functions for them
 */
type ConcreteGenerics = [
]

/**
 * Generated below - DO NOT EDIT
 */

type __GenGenPlainObject<T> = T extends object
  ? T extends readonly unknown[]
    ? never
    : T extends (...args: any[]) => any
      ? never
      : T extends Date
        ? never
        : T
  : never;

type GenGenHelpers<T extends object> = {
  [K in keyof T as __GenGenPlainObject<NonNullable<T[K]>> extends never
    ? never
    : `generate${Capitalize<string & K>}`]: (
      overrides?: GenGenOverrides<__GenGenPlainObject<NonNullable<T[K]>>>,
    ) => __GenGenPlainObject<NonNullable<T[K]>>;
};

type GenGenOverrides<T extends object> = Partial<T> | ((helpers: GenGenHelpers<T>) => Partial<T>);

function __genGenCreateHelper<T extends object>(base: T): (overrides?: GenGenOverrides<T>) => T {
  return (overrides) => {
    const helpers = {} as GenGenHelpers<T>;
    for (const [key, value] of Object.entries(base as Record<string, unknown>)) {
      if (!value || typeof value !== "object" || Array.isArray(value) || value instanceof Date) {
        continue;
      }

      const helperName = `generate${key[0]?.toUpperCase() ?? ""}${key.slice(1)}`;
      (helpers as Record<string, unknown>)[helperName] = __genGenCreateHelper(value as object);
    }

    const resolvedOverrides: Partial<T> | undefined =
      typeof overrides === "function"
        ? (overrides as (nestedHelpers: GenGenHelpers<T>) => Partial<T>)(helpers)
        : overrides;

    return {
      ...base,
      ...resolvedOverrides,
    };
  };
}

export type GenerateUnnamedNestedExampleCallbackParam = (helpers: GenGenHelpers<UnnamedNestedExample>) => Partial<UnnamedNestedExample>;

export function generateUnnamedNestedExample(overrides?: Partial<UnnamedNestedExample> | GenerateUnnamedNestedExampleCallbackParam): UnnamedNestedExample {
  const base: UnnamedNestedExample = {
    a: faker.word.noun(),
    b: {
    c: faker.number.int({ min: 1, max: 1000 }),
    d: faker.datatype.boolean(),
    e: {
    f: faker.word.noun(),
    g: faker.number.int({ min: 1, max: 1000 }),
  },
  },
  };
  const generate = __genGenCreateHelper(base);
  return generate(overrides);
}
