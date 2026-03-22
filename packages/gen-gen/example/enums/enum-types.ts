export enum Status {
  Draft = "draft",
  Active = "active",
  Closed = "closed",
}

export enum Priority {
  Low = 1,
  Medium,
  High = 10,
}

export type Ticket = {
  status: Status;
  priority: Priority;
  title: string;
};
