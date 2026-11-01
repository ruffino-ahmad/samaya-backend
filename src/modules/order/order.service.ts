import { Errors } from "ds-express-errors";
import { TicketModel } from "../ticket/ticket.model";
import OrderModel, { type TypeVoucher } from "./order.model";
import type {
  CreateOrderInput,
  OrderNotificationInput,
  OrderQueryInput,
} from "./order.validation.js";
import mongoose from "mongoose";
import { getUUID } from "../../utils/id.js";
import payment, { type Payment } from "../../utils/payment.js";
import { escapeRegex } from "../../utils/regex.js";
import { ORDER_STATUS, ROLES } from "../../utils/constant.js";
import { FRONTEND_BASE_URL } from "../../utils/env.js";

interface CreateOrderParams {
  userId: string;
  payload: CreateOrderInput;
}

interface CompleteOrderParams {
  userId: string;
  orderId: string;
  role?: string;
}

interface findAllByMemberParams {
  userId: string;
  query: OrderQueryInput;
}

interface findOneParams {
  orderId: string;
  userId?: string;
  role?: string;
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

    const paymentPayload: Payment = {
      transaction_details: {
        order_id: orderId,
        gross_amount: total,
      },
    };

    if (FRONTEND_BASE_URL) {
      paymentPayload.callbacks = {
        finish: `${FRONTEND_BASE_URL}/payment/success`,
        pending: `${FRONTEND_BASE_URL}/payment/progress`,
        error: `${FRONTEND_BASE_URL}/payment/failed`,
      };
    }

    const paymentResponse = await payment.createLink(paymentPayload);

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

const findOne = async ({ orderId, userId, role }: findOneParams) => {
  // Admin boleh melihat semua order, member hanya miliknya sendiri.
  const filter =
    role === ROLES.ADMIN
      ? { orderId }
      : {
          orderId,
          createdBy: new mongoose.Types.ObjectId(`${userId}`),
        };

  const order = await OrderModel.findOne(filter).populate(
    "createdBy",
    "fullname username email",
  );

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

const complete = async ({ userId, orderId, role }: CompleteOrderParams) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Admin boleh menyelesaikan order milik member mana pun.
    const filter =
      role === ROLES.ADMIN
        ? { orderId, status: ORDER_STATUS.PENDING }
        : {
            orderId,
            createdBy: new mongoose.Types.ObjectId(userId),
            status: ORDER_STATUS.PENDING,
          };

    const order = await OrderModel.findOneAndUpdate(
      filter,
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

const pending = async ({ orderId }: CompleteOrderParams) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Hanya order yang dibatalkan yang bisa dikembalikan ke pending.
    const order = await OrderModel.findOneAndUpdate(
      {
        orderId,
        status: ORDER_STATUS.CANCELLED,
      },
      {
        $set: {
          status: ORDER_STATUS.PENDING,
        },
      },
      {
        returnDocument: "after",
        session,
      },
    );

    if (!order) {
      throw Errors.NotFound(
        "Order cannot be set to pending (only cancelled orders can be reopened)",
      );
    }

    // Stok dikembalikan saat cancel, jadi harus dipotong lagi saat di-reopen.
    const ticketUpdate = await TicketModel.findByIdAndUpdate(
      order.ticket,
      {
        $inc: { quantity: -order.quantity },
      },
      {
        returnDocument: "after",
        session,
      },
    );

    if (!ticketUpdate) {
      throw Errors.NotFound("Related ticket not found to deduct stock");
    }

    if (ticketUpdate.quantity < 0) {
      throw Errors.Conflict(
        "Not enough tickets available to reopen this order",
      );
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
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await OrderModel.findOne({ orderId }).session(session);

    if (!order) {
      throw Errors.NotFound("Order not found");
    }

    // Admin boleh menghapus order dengan status apa pun.
    // Order pending masih memegang stok tiket, jadi stok harus dikembalikan.
    // Order completed tidak mengembalikan stok karena tiket sudah terjual/terpakai.
    if (order.status === ORDER_STATUS.PENDING) {
      const ticketUpdate = await TicketModel.findByIdAndUpdate(
        order.ticket,
        {
          $inc: { quantity: order.quantity },
        },
        {
          session,
        },
      );

      if (!ticketUpdate) {
        throw Errors.NotFound("Related ticket not found to restore stock");
      }
    }

    await OrderModel.deleteOne({ orderId }).session(session);

    await session.commitTransaction();

    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

/**
 * Menangani notifikasi (webhook) dari Midtrans.
 * Hanya fungsi ini yang boleh mengubah status order berdasarkan hasil pembayaran,
 * dan hanya setelah signature_key terverifikasi.
 */
const notification = async (payload: OrderNotificationInput) => {
  if (!payment.verifySignature(payload)) {
    throw Errors.Unauthorized("Invalid signature key");
  }

  console.info(
    "[midtrans] notification",
    payload.order_id,
    payload.transaction_status,
    payload.status_code,
  );

  const order = await OrderModel.findOne({ orderId: payload.order_id });

  if (!order) {
    // Bukan order kita: jangan minta Midtrans retry, cukup catat.
    console.warn("[midtrans] notification for unknown order", payload.order_id);
    return null;
  }

  // Pastikan nominal yang dibayar sama dengan total order.
  if (Number(payload.gross_amount) !== order.total) {
    console.warn(
      "[midtrans] amount mismatch",
      payload.order_id,
      payload.gross_amount,
      order.total,
    );
    return order;
  }

  // Idempoten: notifikasi bisa dikirim berulang kali oleh Midtrans.
  if (order.status !== ORDER_STATUS.PENDING) {
    console.info(
      "[midtrans] order already",
      order.status,
      "- notification ignored",
    );
    return order;
  }

  const isPaid =
    payload.transaction_status === "settlement" ||
    (payload.transaction_status === "capture" &&
      payload.fraud_status === "accept");

  const isFailed = ["deny", "cancel", "expire", "failure"].includes(
    payload.transaction_status,
  );

  if (isPaid) {
    console.info("[midtrans] order paid -> completed", order.orderId);
    return complete({
      userId: String(order.createdBy),
      orderId: order.orderId,
    });
  }

  if (isFailed) {
    console.info("[midtrans] order failed -> cancelled", order.orderId);
    return cancelled({
      userId: String(order.createdBy),
      orderId: order.orderId,
    });
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
  notification,
};
