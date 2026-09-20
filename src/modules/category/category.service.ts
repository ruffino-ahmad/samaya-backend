import { ca } from "zod/v4/locales";
import { escapeRegex } from "../../utils/regex";
import CategoryModel, { type ICategory } from "./category.model";
import type {
  CategoryQueryInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./category.validation";

type CategoryFilter = Parameters<typeof CategoryModel.find>[0];

const create = async (payload: CreateCategoryInput) => {
  const { name, description, icon } = payload;

  const category = await CategoryModel.create({ name, description, icon });
  return category;
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
    data: categories,
    meta: {
      page,
      limit,
      totalItems,
      totalPages,
      hashNextPage: page < totalPages,
      hashPrevPage: page > 1,
    },
  };
};

const findOne = async (id: string) => {
  const category = await CategoryModel.findById(id);
  return category;
};

const update = async (id: string, payload: UpdateCategoryInput) => {
  const category = await CategoryModel.findByIdAndUpdate(id, payload, {
    returnDocument: "after",
  });

  return category;
};
const remove = async (id: string) => {
  const category = await CategoryModel.findByIdAndDelete(id);
};

export default { create, findAll, findOne, update, remove };
