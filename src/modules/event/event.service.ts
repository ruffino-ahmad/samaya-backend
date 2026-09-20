import { Errors } from "ds-express-errors";
import CategoryModel from "../category/category.model";
import type { IEvent } from "./event.model";
import type { EventQueryInput } from "./event.validation";
import EventModel from "./event.model";
import { resolvingUniqueSlug } from "../../utils/slug";
import { escapeRegex } from "../../utils/regex";
import type { CreateEventArgs, UpdateEventArgs } from "./event.interface.js";

const create = async ({
  payload,
  userId,
}: CreateEventArgs): Promise<IEvent> => {
  const categoryExists = await CategoryModel.exists({ _id: payload.category });
  if (!categoryExists) {
    throw Errors.NotFound("Selected category does not exists");
  }

  const isDuplicate = await EventModel.exists({
    name: payload.name,
    startDate: payload.startDate,
  });

  if (isDuplicate) {
    throw Errors.Conflict(
      "An event with the exact same name and start date already exists",
    );
  }

  const slug = await resolvingUniqueSlug(payload.name);

  const result = await EventModel.create({
    ...payload,
    slug,
    createdBy: userId,
  });

  return result;
};

const findAll = async (query: EventQueryInput) => {
  const { page, limit, search, category, isFeatured, isOnline, isPublish } =
    query;
  const skip = (page - 1) * limit;

  const filter = {
    ...(search && {
      name: {
        $regex: escapeRegex(search),
        $options: "i",
      },
    }),

    ...(category && {
      category,
    }),

    ...(typeof isFeatured === "boolean" && {
      isFeatured,
    }),

    ...(typeof isOnline === "boolean" && {
      isOnline,
    }),

    ...(typeof isPublish === "boolean" && {
      isPublish,
    }),
  };

  const [events, totalItems] = await Promise.all([
    EventModel.find(filter)
      .populate("category", "name slug")
      .populate("createdBy", "fullname username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    EventModel.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    data: events,
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
  const event = await EventModel.findById(id);
  return event;
};

const update = async ({ id, payload }: UpdateEventArgs) => {
  const event = await EventModel.findById(id);
  if (!event) {
    throw Errors.NotFound("Event not found");
  }

  if (payload.category) {
    const categoryExists = await CategoryModel.exists({
      _id: payload.category,
    });
    if (!categoryExists) {
      throw Errors.NotFound("Selected category does not exists");
    }
  }

  const targetName = payload.name ?? event.name;
  const targetStartDate = payload.startDate ?? event.startDate;

  if (payload.name || payload.startDate) {
    const isDuplicate = await EventModel.exists({
      _id: {
        $ne: id,
      },
      name: targetName,
      startDate: targetStartDate,
    });

    if (isDuplicate) {
      throw Errors.Conflict(
        "Another event with the exact same name and start date already exists",
      );
    }
  }

  let slug = event.slug;
  if (payload.name && payload.name !== event.name) {
    slug = await resolvingUniqueSlug(payload.name, id);
  }

  const updatedEvent = await EventModel.findByIdAndUpdate(
    id,
    {
      ...payload,
      slug,
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  )
    .populate("category", "name slug")
    .populate("createdBy", "fullname username email");

  if (!updatedEvent) {
    throw Errors.NotFound("Event not found");
  }

  return updatedEvent;
};

const remove = async (id: string) => {
  const event = await EventModel.findByIdAndDelete(id, {
    returnDocument: "after",
  });

  return event;
};

const findOneBySlug = async (slug: string) => {
  const event = await EventModel.findOne({ slug })
    .populate("category", "name slug")
    .populate("createdBy", "fullname username email");

  if (!event) {
    throw Errors.NotFound("Event not found");
  }

  return event;
};

export default {
  create,
  findAll,
  findOne,
  update,
  remove,
  findOneBySlug,
};
