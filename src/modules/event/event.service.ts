import { Errors } from "ds-express-errors";
import CategoryModel from "../category/category.model";
import uploadService from "../upload/upload.service";
import { getFolderFromBlobName } from "../upload/upload.validation";
import type { IEvent } from "./event.model";
import type { EventQueryInput, UpdateEventInput } from "./event.validation";
import EventModel from "./event.model";
import { resolvingUniqueSlug } from "../../utils/slug";
import { escapeRegex } from "../../utils/regex";
import type { CreateEventArgs, UpdateEventArgs } from "./event.interface.js";

type MaybeHydrated = {
  toObject?: () => unknown;
};

const toPlainObject = <T>(category: T): T => {
  if (typeof (category as MaybeHydrated).toObject === "function") {
    return (category as { toObject: () => T }).toObject();
  }
  return category;
};

const serialize = <T extends { banner: string }>(
  event: T,
): T & { bannerUrl: string | null } => {
  const plain = toPlainObject(event);
  const isLegacyUrl = /^https?:\/\//.test(plain.banner);

  return {
    ...plain,
    bannerUrl: isLegacyUrl
      ? plain.banner
      : getFolderFromBlobName(plain.banner)
        ? uploadService.getPublicUrl(plain.banner)
        : null,
  };
};

const deleteBlobIfUnreferenced = async (banner: string) => {
  if (!getFolderFromBlobName(banner)) return;

  const stillReferenced = await EventModel.countDocuments({ banner }).catch(
    () => null,
  );

  if (stillReferenced === null || stillReferenced > 0) return;

  await uploadService.deleteBlob(banner).catch(() => undefined);
};

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

  const validation = await uploadService.validateUploadedBlob(payload.banner);
  if (!validation.isValid) {
    throw Errors.BadRequest(
      `Invalid banner file: ${validation.reason ?? "unknown reason"}`,
    );
  }

  try {
    const result = await EventModel.create({
      ...payload,
      slug,
      createdBy: userId,
    });

    return serialize(result);
  } catch (error) {
    await uploadService.deleteBlob(payload.banner).catch(() => undefined);
    throw error;
  }
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
    data: events.map(serialize),
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

  if (!event) {
    throw Errors.NotFound("Event not found");
  }

  return serialize(event);
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

  if (payload.banner) {
    const validation = await uploadService.validateUploadedBlob(payload.banner);
    if (!validation.isValid) {
      throw Errors.BadRequest(
        `Invalid banner file: ${validation.reason ?? "unknown reason"}`,
      );
    }
  }

  // Buang key yang tidak dikirim klien agar tidak menimpa data tersimpan.
  const definedPayload = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as UpdateEventInput;

  const updatedEvent = await EventModel.findByIdAndUpdate(
    id,
    {
      ...definedPayload,
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

  if (payload.banner && event.banner !== payload.banner) {
    await deleteBlobIfUnreferenced(event.banner);
  }

  return serialize(updatedEvent);
};

const remove = async (id: string) => {
  const event = await EventModel.findByIdAndDelete(id, {
    returnDocument: "after",
  });

  if (!event) {
    throw Errors.NotFound("Event not found");
  }

  await deleteBlobIfUnreferenced(event.banner);

  return serialize(event);
};

const findOneBySlug = async (slug: string) => {
  const event = await EventModel.findOne({ slug })
    .populate("category", "name slug")
    .populate("createdBy", "fullname username email");

  if (!event) {
    throw Errors.NotFound("Event not found");
  }

  return serialize(event);
};

export default {
  create,
  findAll,
  findOne,
  update,
  remove,
  findOneBySlug,
  deleteBlobIfUnreferenced,
};
