import type {APIResponse, Party, Pokeball, Pokemon} from "./types";

import {faker} from "@faker-js/faker";

/**
 * Add concrete generics here to generate functions for them
 */
type ConcreteGenerics = [
    APIResponse<Pokemon>,
]

/**
 * Generated below - DO NOT EDIT
 */

export function generateParty(overrides?: Partial<Party>): Party {
  return {
  name: faker.word.noun(),
  members: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => generatePokemon()),
  ...overrides
};
}

export function generatePokeball(overrides?: Partial<Pokeball>): Pokeball {
  return {
  type: faker.word.noun(),
  pokemon: faker.datatype.boolean() ? generatePokemon() : null,
  ...overrides
};
}

export function generatePokemon(overrides?: Partial<Pokemon>): Pokemon {
  return {
  id: faker.number.int({ min: 1, max: 1000 }),
  name: faker.word.noun(),
  type: faker.word.noun(),
  ...overrides
};
}

export function generatePokemonAPIResponse(overrides?: Partial<APIResponse<Pokemon>>): APIResponse<Pokemon> {
  return {
  data: generatePokemon(),
  error: faker.datatype.boolean() ? faker.word.noun() : undefined,
  ...overrides
};
}
