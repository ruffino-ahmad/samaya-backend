import { customAlphabet } from "nanoid";

export const getUUID = () => {
  const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 10);
  return nanoid(5);
};
