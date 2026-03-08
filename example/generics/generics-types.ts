export type UserSummary = {
  id: string;
  handle: string;
  role: "admin" | "member";
};

export type ApiEnvelope<T> = {
  data: T;
  requestId: string;
  error?: string;
};

export type Edge<T> = {
  node: T;
  cursor: string;
};

export type Connection<T> = {
  edges: Edge<T>[];
  hasNextPage: boolean;
};
