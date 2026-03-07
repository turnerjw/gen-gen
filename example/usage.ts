import { generateParty, generatePokeball, generatePokemon, generatePokemonAPIResponse } from "./data-gen";

const party = generateParty();
const partyWithOverrides = generateParty({ name: "Ash's Party", members: [generatePokemon({ name: "Pikachu" })] });

const pokeball = generatePokeball();
const pokeballWithOverrides = generatePokeball({ type: "Ultra Ball" });

const pokemon = generatePokemon();
const pokemonWithOverrides = generatePokemon({ name: "Pikachu" });

const apiResponse = generatePokemonAPIResponse();
const apiResponseWithOverrides = generatePokemonAPIResponse({ data: generatePokemon({ name: "Pikachu" }) });