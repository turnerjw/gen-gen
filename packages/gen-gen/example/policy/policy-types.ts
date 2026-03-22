export type PolicyExample = {
  id: string;
  email?: string;
  readonly createdAt: string;
  metadata: {
    [key: string]: string;
  };
};
