import type {
  UpdatePasswordInput,
  UpdateProfileInput,
} from "./auth.validation.js";

export interface UpdateProfileArgs {
  payload: UpdateProfileInput;
  userId: string;
}

export interface UpdatePasswordArgs {
  payload: UpdatePasswordInput;
  userId: string;
}
