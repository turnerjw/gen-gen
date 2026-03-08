import {generateInvoice} from "./data-gen-branded";

const invoice = generateInvoice({
  note: "manual override",
});

console.log(invoice);
