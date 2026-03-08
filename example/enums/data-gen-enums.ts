import type {Ticket} from "./enum-types";
import {faker} from "@faker-js/faker";

/**
 * Add concrete generics here to generate functions for them
 */
type ConcreteGenerics = [];

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

function __genGenIsMergeable(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date);
}

function __genGenMergeDeep<T>(base: T, overrides: Partial<T> | undefined): T {
  if (!overrides) {
    return base;
  }

  if (!__genGenIsMergeable(base) || !__genGenIsMergeable(overrides)) {
    return overrides as T;
  }

  const result: Record<string, unknown> = { ...base };
  for (const [key, overrideValue] of Object.entries(overrides)) {
    const baseValue = result[key];
    if (__genGenIsMergeable(baseValue) && __genGenIsMergeable(overrideValue)) {
      result[key] = __genGenMergeDeep(baseValue, overrideValue);
      continue;
    }

    result[key] = overrideValue;
  }

  return result as T;
}

function __genGenCreateHelper<T extends object>(
  base: T,
  helperCache: WeakMap<object, unknown> = new WeakMap(),
): (overrides?: GenGenOverrides<T>) => T {
  const cached = helperCache.get(base as object);
  if (cached) {
    return cached as (overrides?: GenGenOverrides<T>) => T;
  }

  const generate = (overrides?: GenGenOverrides<T>): T => {
    const helpers = {} as GenGenHelpers<T>;
    for (const [key, value] of Object.entries(base as Record<string, unknown>)) {
      if (!__genGenIsMergeable(value)) {
        continue;
      }

      const helperName = `generate${key[0]?.toUpperCase() ?? ""}${key.slice(1)}`;
      (helpers as Record<string, unknown>)[helperName] = __genGenCreateHelper(value, helperCache);
    }

    const resolvedOverrides: Partial<T> | undefined =
      typeof overrides === "function"
        ? (overrides as (nestedHelpers: GenGenHelpers<T>) => Partial<T>)(helpers)
        : overrides;

    return { ...base, ...resolvedOverrides };
  };

  helperCache.set(base as object, generate);
  return generate;
}

export type GenerateTicketCallbackParam = (helpers: GenGenHelpers<Ticket>) => Partial<Ticket>;

export function generateTicket(overrides?: Partial<Ticket> | GenerateTicketCallbackParam): Ticket {
  const base: Ticket = {
    status: faker.helpers.arrayElement(["draft", "active", "closed"]) as import("/Users/justinturner/Developer/gen-gen/example/enums/enum-types").Status,
    priority: faker.helpers.arrayElement([1, 2, 10]) as import("/Users/justinturner/Developer/gen-gen/example/enums/enum-types").Priority,
    title: faker.word.noun(),
  };
  const generate = __genGenCreateHelper(base);
  return generate(overrides);
}
