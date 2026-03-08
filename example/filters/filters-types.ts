export type Account = {
  id: number;
  email: string;
};

export type Profile = {
  displayName: string;
};

export type Session = {
  token: string;
  account: Account;
};

export type Envelope<T> = {
  payload: T;
};
