import {generatePokemonAPIResponse, generatePokemonPaginated} from "./data-gen-generics";

const response = generatePokemonAPIResponse({
  error: undefined,
});

const page = generatePokemonPaginated(() => ({
  items: [response.data],
}));

console.log(response.data.id, page.items.length);
