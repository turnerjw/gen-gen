import {generateCustomFakerExample} from "./data-gen-custom-faker";

const value = generateCustomFakerExample();
console.log(value.id, value.email, value.createdAt);
