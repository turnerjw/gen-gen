import type {ApiEnvelope, Connection, UserSummary} from "./generics-types";
import {faker} from "@faker-js/faker";

/**
 * Add concrete generics here to generate functions for them
 */
type ConcreteGenerics = [
  ApiEnvelope<UserSummary>,
  Connection<UserSummary>,
];

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

export type GenerateUserSummaryCallbackParam = (helpers: GenGenHelpers<UserSummary>) => Partial<UserSummary>;

export function generateUserSummary(overrides?: Partial<UserSummary> | GenerateUserSummaryCallbackParam): UserSummary {
  const base: UserSummary = {
    id: faker.word.noun(),
    handle: faker.word.noun(),
    role: faker.helpers.arrayElement(["admin", "member"]),
  };
  const generate = __genGenCreateHelper(base);
  return generate(overrides);
}

export type GenerateUserSummaryApiEnvelopeCallbackParam = (helpers: GenGenHelpers<ApiEnvelope<UserSummary>>) => Partial<ApiEnvelope<UserSummary>>;

export function generateUserSummaryApiEnvelope(overrides?: Partial<ApiEnvelope<UserSummary>> | GenerateUserSummaryApiEnvelopeCallbackParam): ApiEnvelope<UserSummary> {
  const base: ApiEnvelope<UserSummary> = {
    data: generateUserSummary(),
    requestId: faker.word.noun(),
    error: faker.datatype.boolean() ? faker.word.noun() : undefined,
  };
  const generate = __genGenCreateHelper(base);
  return generate(overrides);
}

export type GenerateUserSummaryConnectionCallbackParam = (helpers: GenGenHelpers<Connection<UserSummary>>) => Partial<Connection<UserSummary>>;

export function generateUserSummaryConnection(overrides?: Partial<Connection<UserSummary>> | GenerateUserSummaryConnectionCallbackParam): Connection<UserSummary> {
  const base: Connection<UserSummary> = {
    edges: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
      node: generateUserSummary(),
      cursor: faker.word.noun(),
    })),
    hasNextPage: faker.datatype.boolean(),
  };
  const generate = __genGenCreateHelper(base);
  return generate(overrides);
}
