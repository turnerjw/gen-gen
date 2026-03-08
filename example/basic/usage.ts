import {generateCheckoutDraft} from "./data-gen";

const draft = generateCheckoutDraft({
  orderId: "order-test-001",
});

console.log(draft);

const draftWithHelpers = generateCheckoutDraft(({generateShipping}) => ({
  shipping: generateShipping(({generateAddress}) => ({
    address: generateAddress({countryCode: "CA"}),
    instructions: "Leave at side door",
  })),
}));

console.log(draftWithHelpers.shipping.address.countryCode);
