import {generateCheckoutDraft} from "./data-gen";

const sample = generateCheckoutDraft(({generateShipping}) => ({
  shipping: generateShipping(({generateAddress}) => ({
    address: generateAddress({city: "Toronto"}),
  })),
}));

console.log(sample.shipping.address.city);
