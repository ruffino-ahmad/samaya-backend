import type { CreateEventInput, UpdateEventInput } from "./event.validation.js";

export interface CreateEventArgs {
  payload: CreateEventInput;
  userId: string;
}

export interface UpdateEventArgs {
  id: string;
  payload: UpdateEventInput;
}
