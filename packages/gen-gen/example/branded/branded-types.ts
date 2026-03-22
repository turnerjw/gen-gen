export type UserId = string & { readonly __brand: "UserId" };
export type AmountCents = number & { readonly __brand: "AmountCents" };

export type Invoice = {
  id: UserId;
  total: AmountCents;
  note?: string;
};
