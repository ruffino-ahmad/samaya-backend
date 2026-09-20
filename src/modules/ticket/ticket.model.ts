import mongoose, { Schema } from "mongoose";

const TicketSchema = new mongoose.Schema(
  {
    price: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    events: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Event",
    },
    quantity: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const TicketModel = mongoose.model("Ticket", TicketSchema);
