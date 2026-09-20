import { Errors } from "ds-express-errors";
import { escapeRegex } from "../../utils/regex";
import { BannerModel } from "./banner.model";
import type {
  BannerQueryInput,
  CreateBannerInput,
  UpdateBannerInput,
} from "./banner.validation";

interface UpdateBannerArgs {
  id: string;
  payload: UpdateBannerInput;
}

const create = async (payload: CreateBannerInput) => {
  const banner = await BannerModel.create(payload);
  return banner;
};

const findAll = async (query: BannerQueryInput) => {
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

  const [banners, totalItems] = await Promise.all([
    BannerModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    BannerModel.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalItems / limit);
  console.log("masuk");

  return {
    data: banners,
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
  const banner = await BannerModel.findById(id);
  return banner;
};

const update = async ({ id, payload }: UpdateBannerArgs) => {
  const banner = await BannerModel.findById(id);
  if (!banner) {
    throw Errors.NotFound("Banner not found");
  }

  console.log(payload);

  const updatedBanner = await BannerModel.findByIdAndUpdate(id, payload, {
    returnDocument: "after",
    runValidators: true,
  });

  if (!updatedBanner) {
    throw Errors.NotFound("Banner not found");
  }

  return updatedBanner;
};

const remove = async (id: string) => {
  const banner = await BannerModel.findByIdAndDelete(id, {
    returnDocument: "after",
  });

  if (!banner) {
    throw Errors.NotFound("Banner not found");
  }

  return banner;
};

export default {
  create,
  findAll,
  findOne,
  update,
  remove,
};
