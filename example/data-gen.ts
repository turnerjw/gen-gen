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

export type GenerateUnnamedNestedExampleCallbackParam = (helpers: { generateB: (overrides?: Partial<UnnamedNestedExample["b"]>) => UnnamedNestedExample["b"]; }) => Partial<UnnamedNestedExample>;

export function generateUnnamedNestedExample(overrides?: Partial<UnnamedNestedExample> | GenerateUnnamedNestedExampleCallbackParam): UnnamedNestedExample {
  const resolvedOverrides: Partial<UnnamedNestedExample> | undefined =
    typeof overrides === "function"
      ? (overrides as GenerateUnnamedNestedExampleCallbackParam)({
          generateB: (nestedOverrides?: Partial<UnnamedNestedExample["b"]>) => ({ ...{
  c: faker.number.int({ min: 1, max: 1000 }),
  d: faker.datatype.boolean(),
  e: {
  f: faker.word.noun(),
  g: faker.number.int({ min: 1, max: 1000 }),
},
}, ...nestedOverrides }) as UnnamedNestedExample["b"],
        })
      : overrides;
  return {
    a: faker.word.noun(),
    b: {
    c: faker.number.int({ min: 1, max: 1000 }),
    d: faker.datatype.boolean(),
    e: {
    f: faker.word.noun(),
    g: faker.number.int({ min: 1, max: 1000 }),
  },
  },
    ...resolvedOverrides
  };
}
