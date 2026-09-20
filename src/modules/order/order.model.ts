import type { Model, Types } from "mongoose";
import mongoose, { Schema } from "mongoose";
import { ORDER_STATUS } from "../../utils/constant";
import type { TypeResponseMidtrans } from "../../utils/payment";

export type TypeVoucher = {
  voucherId: string;
  isPrint: boolean;
};

export interface Order {
  createdBy: Types.ObjectId;
  events: Types.ObjectId;
  ticket: Types.ObjectId;
  quantity: number;
  total: number;
  status: string;
  payment: TypeResponseMidtrans;
  orderId: string;
  vouchers?: TypeVoucher[];
}

const OrderSchema = new Schema<Order>(
  {
    orderId: {
      type: Schema.Types.String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    events: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    total: {
      type: Schema.Types.Number,
      required: true,
    },
    payment: {
      type: {
        token: {
          type: Schema.Types.String,
          required: true,
        },
        redirect_url: {
          type: Schema.Types.String,
          required: true,
        },
      },
    },
    status: {
      type: Schema.Types.String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
    },
    ticket: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },
    quantity: {
      type: Schema.Types.Number,
      required: true,
    },
    vouchers: {
      type: [
        {
          voucherId: {
            type: Schema.Types.String,
          },
          isPrint: {
            type: Schema.Types.Boolean,
            default: false,
          },
        },
      ],
    },
  },
  {
    timestamps: true,
  },
).index({ orderId: "text" });

const OrderModel: Model<Order> = mongoose.model<Order>("Order", OrderSchema);

export default OrderModel;
