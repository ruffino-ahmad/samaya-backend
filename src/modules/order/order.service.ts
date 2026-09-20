import { Errors } from "ds-express-errors";
import { TicketModel } from "../ticket/ticket.model";
import OrderModel, { type TypeVoucher } from "./order.model";
import type {
  CreateOrderInput,
  OrderIdParamInput,
  OrderQueryInput,
} from "./order.validation.js";
import mongoose from "mongoose";
import { getUUID } from "../../utils/id.js";
import payment from "../../utils/payment.js";
import { escapeRegex } from "../../utils/regex.js";
import { ORDER_STATUS } from "../../utils/constant.js";
import { stat } from "node:fs";
import { th } from "zod/locales";

interface CreateOrderParams {
  userId: string;
  payload: CreateOrderInput;
}

interface CompleteOrderParams {
  userId: string;
  orderId: string;
}

interface findAllByMemberParams {
  userId: string;
  query: OrderQueryInput;
}

const create = async ({ userId, payload }: CreateOrderParams) => {
  const { ticket: ticketId, quantity } = payload;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const ticketData = await TicketModel.findById(ticketId).session(session);
    if (!ticketData) {
      throw Errors.NotFound("Ticket not found");
    }

    if (ticketData.quantity < quantity) {
      throw Errors.BadRequest(
        `Not enough tickets available. Only ${ticketData.quantity} tickets left.`,
      );
    }

    const total: number = ticketData.price * quantity;

    const orderId = `ORDER-${getUUID()}`;

    const paymentResponse = await payment.createLink({
      transaction_details: {
        order_id: orderId,
        gross_amount: total,
      },
    });

    const updateResult = await TicketModel.findByIdAndUpdate(
      ticketId,
      {
        $inc: { quantity: -quantity },
      },
      {
        returnDocument: "after",
        session,
      },
    );

    if (!updateResult) {
      throw Errors.InternalServerError("Failed to update ticket quantity");
    }

    if (updateResult.quantity < 0) {
      throw Errors.Conflict(
        "Ticket sold out. Another user purchased the last available tickets.",
      );
    }

    const order = await OrderModel.create(
      [
        {
          orderId,
          createdBy: new mongoose.Types.ObjectId(userId),
          events: ticketData.events,
          ticket: new mongoose.Types.ObjectId(ticketId),
          quantity,
          total,
          payment: {
            token: paymentResponse.token,
            redirect_url: paymentResponse.redirect_url,
          },
          status: "pending",
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return order[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const findAll = async (query: OrderQueryInput) => {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;

  const filter = {
    ...(search && {
      orderId: {
        $regex: escapeRegex(search),
        $options: "i",
      },
    }),
  };

  const [orders, totalItems] = await Promise.all([
    OrderModel.find(filter)
      .populate("events", "name slug")
      .populate("createdBy", "fullname username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    OrderModel.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    data: orders,
    meta: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

const findOne = async (orderId: string) => {
  const order = await OrderModel.findOne({ orderId });

  if (!order) {
    throw Errors.NotFound("Order not found");
  }

  return order;
};

const findAllByMember = async ({ userId, query }: findAllByMemberParams) => {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;

  const filter = {
    createdBy: new mongoose.Types.ObjectId(userId),
    ...(search && {
      orderId: {
        $regex: escapeRegex(search),
        $options: "i",
      },
    }),
  };

  const [orders, totalItems] = await Promise.all([
    OrderModel.find(filter)
      .populate("events", "name slug")
      .populate("createdBy", "fullname username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    OrderModel.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    data: orders,
    meta: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

const complete = async ({ userId, orderId }: CompleteOrderParams) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await OrderModel.findOneAndUpdate(
      {
        orderId: orderId,
        createdBy: new mongoose.Types.ObjectId(userId),
        status: ORDER_STATUS.PENDING,
      },
      {
        $set: {
          status: ORDER_STATUS.COMPLETED,
        },
      },
      {
        returnDocument: "after",
        session,
      },
    );

    if (!order) {
      throw Errors.NotFound("Order not found or already completed/cancelled");
    }

    const vouchers: TypeVoucher[] = Array.from(
      {
        length: order.quantity,
      },
      () => ({
        voucherId: `VOUCHER-${getUUID()}`,
        isPrint: false,
      }),
    );

    const updatedOrder = await OrderModel.findOneAndUpdate(
      {
        orderId,
      },
      {
        $set: {
          vouchers,
        },
      },
      {
        returnDocument: "after",
        session,
      },
    );

    await session.commitTransaction();

    return updatedOrder;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const pending = async ({ userId, orderId }: CompleteOrderParams) => {
  const order = await OrderModel.findOneAndUpdate(
    {
      orderId,
      status: {
        $in: [
          ORDER_STATUS.COMPLETED,
          ORDER_STATUS.CANCELLED,
          ORDER_STATUS.PENDING,
        ],
      },
    },
    {
      returnDocument: "after",
    },
  );

  if (!order) {
    throw Errors.NotFound(
      "Order cannot be found or set to pending (already completed/cancelled/pending)",
    );
  }

  return order;
};

const cancelled = async ({ userId, orderId }: CompleteOrderParams) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await OrderModel.findOneAndUpdate(
      {
        orderId,
        status: ORDER_STATUS.PENDING,
      },
      {
        $set: {
          status: ORDER_STATUS.CANCELLED,
        },
      },
      {
        returnDocument: "after",
        session,
      },
    );

    if (!order) {
      throw Errors.NotFound("Order not found or already completed/cancelled");
    }

    const ticketUpdate = await TicketModel.findByIdAndUpdate(
      order.ticket,
      {
        $inc: {
          quantity: order.quantity,
        },
      },
      {
        session,
      },
    );

    if (!ticketUpdate) {
      throw Errors.NotFound("Related ticket not found to restore stock");
    }

    await session.commitTransaction();
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const remove = async (orderId: string) => {
  const order = await OrderModel.findOneAndDelete(
    {
      orderId,
    },
    {
      returnDocument: "after",
    },
  );

  if (!order) {
    throw Errors.NotFound("Order not found");
  }

  return order;
};

export default {
  create,
  findAll,
  findOne,
  findAllByMember,
  complete,
  pending,
  cancelled,
  remove,
};
