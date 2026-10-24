import { Errors } from "ds-express-errors";
import EventModel from "../event/event.model";
import { escapeRegex } from "../../utils/regex";
import uploadService from "../upload/upload.service";
import { getFolderFromBlobName } from "../upload/upload.validation";
import CategoryModel from "./category.model";
import type {
  CategoryQueryInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./category.validation";

type WithIconUrl<T> = T & { iconUrl: string | null };

interface MaybeHydrated {
  toObject?: () => unknown;
}

const toPlainObject = <T>(category: T): T => {
  if (typeof (category as MaybeHydrated).toObject === "function") {
    return (category as { toObject: () => T }).toObject();
  }
  return category;
};

const serialize = <T extends { icon: string }>(
  category: T,
): WithIconUrl<T> & Record<string, unknown> => {
  const plain = toPlainObject(category);

  return {
    ...plain,
    iconUrl: getFolderFromBlobName(plain.icon)
      ? uploadService.getPublicUrl(plain.icon)
      : null,
  };
};

const create = async (payload: CreateCategoryInput) => {
  const { name, description, icon } = payload;

  const validation = await uploadService.validateUploadedBlob(icon);
  if (!validation.isValid) {
    throw Errors.BadRequest(
      `Invalid icon file: ${validation.reason ?? "unknown reason"}`,
    );
  }

  try {
    const category = await CategoryModel.create({ name, description, icon });
    return serialize(category);
  } catch (error) {
    await uploadService.deleteBlob(icon).catch(() => undefined);
    throw error;
  }
};

const findAll = async (query: CategoryQueryInput) => {
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

  const [categories, totalItems] = await Promise.all([
    CategoryModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean(),
    CategoryModel.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    data: categories.map(serialize),
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
  const category = await CategoryModel.findById(id);

  if (!category) {
    throw Errors.NotFound("Category not found");
  }

  return serialize(category);
};

const deleteBlobIfUnreferenced = async (icon: string) => {
  if (!getFolderFromBlobName(icon)) return;

  const stillReferenced = await CategoryModel.countDocuments({ icon }).catch(
    () => null,
  );

  if (stillReferenced === null || stillReferenced > 0) return;

  await uploadService.deleteBlob(icon).catch(() => undefined);
};

const update = async (id: string, payload: UpdateCategoryInput) => {
  const category = await CategoryModel.findById(id);

  if (!category) {
    throw Errors.NotFound("Category not found");
  }

  if (payload.icon) {
    const validation = await uploadService.validateUploadedBlob(payload.icon);
    if (!validation.isValid) {
      throw Errors.BadRequest(
        `Invalid icon file: ${validation.reason ?? "unknown reason"}`,
      );
    }
  }

  const updated = await CategoryModel.findByIdAndUpdate(id, payload, {
    returnDocument: "after",
  });

  if (!updated) {
    throw Errors.NotFound("Category not found");
  }

  if (payload.icon && category.icon !== payload.icon) {
    await deleteBlobIfUnreferenced(category.icon);
  }

  return serialize(updated);
};
const remove = async (id: string) => {
  const category = await CategoryModel.findById(id);

  if (!category) {
    throw Errors.NotFound("Category not found");
  }

  const usedByEvents = await EventModel.countDocuments({ category: id });
  if (usedByEvents > 0) {
    throw Errors.Conflict(
      `Cannot delete category: still used by ${usedByEvents} event(s)`,
    );
  }

  await CategoryModel.findByIdAndDelete(id);

  await deleteBlobIfUnreferenced(category.icon);

  return serialize(category);
};

export default { create, findAll, findOne, update, remove, deleteBlobIfUnreferenced };
