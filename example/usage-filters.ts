import {generateAccount, generateSession} from "./data-gen-filters";

const account = generateAccount();
const session = generateSession({account});

console.log(account.email, session.token);
