export type Pokemon = {
  id: number;
  name: string;
  type: string;
};

export type APIResponse<T> = {
  data: T;
  error?: string;
};

export type Paginated<T> = {
  items: T[];
  nextPage?: number;
};
