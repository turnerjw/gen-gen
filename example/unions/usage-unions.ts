import {generateUnionExample} from "./data-gen-unions";

const value = generateUnionExample();

if (value.payload.kind === "user") {
  console.log("user", value.payload.userId);
} else {
  console.log("order", value.payload.orderId);
}
