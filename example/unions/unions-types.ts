export type EventPayload =
  | {kind: "user"; userId: string; admin: boolean}
  | {kind: "order"; orderId: number; total: number};

export type UnionExample = {
  status: "idle" | "loading" | "error";
  priority: 1 | 2 | 3;
  payload: EventPayload;
};
