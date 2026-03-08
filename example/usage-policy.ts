import {generatePolicyExample} from "./data-gen-policy";

const value = generatePolicyExample({
  metadata: {
    region: "ca-central-1",
  },
});

console.log(value);
