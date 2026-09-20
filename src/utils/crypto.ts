import crypto from "crypto";

export const encrypActivationCodeInput = (): string => {
  const activationCode = crypto.randomBytes(16).toString("hex");
  return activationCode;
};
