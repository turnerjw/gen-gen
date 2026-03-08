/** @gen-gen-ignore */
export type InternalOnly = {
  token: string;
};

export type Account = {
  id: string;
  /** @gen-gen-ignore */
  profile: {
    locale: string;
    timezone: string;
  };
  email: string;
};
