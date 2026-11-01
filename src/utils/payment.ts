import axios from "axios";
import crypto from "node:crypto";
import { MIDTRANS_SERVER_KEY, MIDTRANS_TRANSACTION_URL } from "./env";
import { Errors } from "ds-express-errors";

export interface Payment {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  callbacks?: {
    finish?: string;
    error?: string;
    pending?: string;
  };
}

export interface PaymentNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}

export type TypeResponseMidtrans = {
  token: string;
  redirect_url: string;
};

const createLink = async (payload: Payment): Promise<TypeResponseMidtrans> => {
  const result = await axios.post<TypeResponseMidtrans>(
    `${MIDTRANS_TRANSACTION_URL}`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64")}`,
      },
    },
  );

  if (result.status !== 201) {
    throw Errors.ServiceUnavailable("Payment failed");
  }

  return result?.data;
};

/**
 * Midtrans mengirim signature_key = SHA512(order_id + status_code + gross_amount + ServerKey).
 * Dipakai untuk memastikan notifikasi benar-benar berasal dari Midtrans.
 */
const verifySignature = (payload: PaymentNotification): boolean => {
  if (!MIDTRANS_SERVER_KEY) return false;

  const expected = crypto
    .createHash("sha512")
    .update(
      `${payload.order_id}${payload.status_code}${payload.gross_amount}${MIDTRANS_SERVER_KEY}`,
    )
    .digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(payload.signature_key);

  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};

export default {
  createLink,
  verifySignature,
};
