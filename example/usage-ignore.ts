import {generateAccount} from "./data-gen-ignore";

const account = generateAccount({
  profile: {
    locale: "en-CA",
    timezone: "America/Toronto",
  },
});

console.log(account);
