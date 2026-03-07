import {generateUnnamedNestedExample} from "./data-gen";

const sample = generateUnnamedNestedExample(({generateB}) => ({
  b: generateB(({generateE}) => ({
    e: generateE({f: "x"}),
  })),
}));

console.log(sample.b.e.f);
