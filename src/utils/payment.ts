import axios from "axios";
import { MIDTRANS_SERVER_KEY, MIDTRANS_TRANSACTION_URL } from "./env";
import { Errors } from "ds-express-errors";

export interface Payment {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
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

export default {
  createLink,
};
