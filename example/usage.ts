import { generateUnnamedNestedExample } from "./data-gen";

const data = generateUnnamedNestedExample({a: "test"});

console.log(data);

const dataWithCallback = generateUnnamedNestedExample(({ generateB }) => ({
    b: generateB({ c: 42 })
}));

console.log(dataWithCallback);