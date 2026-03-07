import { generateUnnamedNestedExample } from "./data-gen";

const data = generateUnnamedNestedExample({a: "test"});

console.log(data);

const dataWithCallback = generateUnnamedNestedExample(({ generateB }) => ({
    b: generateB(() => ({}))
}));

console.log(dataWithCallback);