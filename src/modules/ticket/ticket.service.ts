import { Errors } from "ds-express-errors";
import { escapeRegex } from "../../utils/regex";
import { TicketModel } from "./ticket.model";
import type {
  CreateTicketInput,
  TicketQueryInput,
  UpdateTicketInput,
} from "./ticket.validation";
import EventModel from "../event/event.model";
import type { IdParamInput } from "../../validations/common.validation";

interface UpdateTicketArgs {
  id: string;
  payload: UpdateTicketInput;
}

const create = async (payload: CreateTicketInput) => {
  const eventExists = await EventModel.exists({ _id: payload.events });
  if (!eventExists) {
    throw Errors.NotFound("Selected event does not exists");
  }

  const ticket = await TicketModel.create(payload);
  return ticket;
};

const findAll = async (query: TicketQueryInput) => {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;

  const filter = {
    ...(search && {
      name: {
        $regex: escapeRegex(search),
        $options: "i",
      },
    }),
  };

  const [tickets, totalItems] = await Promise.all([
    TicketModel.find(filter)
      .populate("events", "name description")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TicketModel.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    data: tickets,
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

const findOne = async (id: string) => {
  const ticket = await TicketModel.findById(id).populate(
    "events",
    "name startDate endDate banner location",
  );

  if (!ticket) {
    throw Errors.NotFound("Ticket not found");
  }

  return ticket;
};

const update = async ({ id, payload }: UpdateTicketArgs) => {
  const ticket = await TicketModel.findById(id);
  if (!ticket) {
    throw Errors.NotFound("Ticket not found");
  }

  console.log(payload);

  if (payload.events) {
    const eventExists = await EventModel.exists({
      _id: payload.events,
    });
    if (!eventExists) {
      throw Errors.NotFound("Selected event does not exists");
    }
  }

  const updatedTicket = await TicketModel.findByIdAndUpdate(id, payload, {
    returnDocument: "after",
    runValidators: true,
  }).populate("events", "name description");

  if (!updatedTicket) {
    throw Errors.NotFound("ticket not found");
  }

  return updatedTicket;
};

const remove = async (id: string) => {
  const ticket = await TicketModel.findByIdAndDelete(id, {
    returnDocument: "after",
  });

  if (!ticket) {
    throw Errors.NotFound("Ticket not found");
  }

  return ticket;
};

const findAllByticket = async (eventId: string) => {
  const ticket = await TicketModel.find({ events: eventId });
  if (!ticket) {
    throw Errors.NotFound("Ticket not found");
  }

  return ticket;
};

export default {
  create,
  findAll,
  findOne,
  update,
  remove,
  findAllByticket,
};
