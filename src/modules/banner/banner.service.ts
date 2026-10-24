import { Errors } from "ds-express-errors";
import { escapeRegex } from "../../utils/regex";
import uploadService from "../upload/upload.service";
import { getFolderFromBlobName } from "../upload/upload.validation";
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

type WithImageUrl<T> = T & { imageUrl: string | null };

interface MaybeHydrated {
  toObject?: () => unknown;
}

const toPlainObject = <T>(banner: T): T => {
  if (typeof (banner as MaybeHydrated).toObject === "function") {
    return (banner as { toObject: () => T }).toObject();
  }
  return banner;
};

const serialize = <T extends { image: string }>(banner: T): WithImageUrl<T> => {
  const plain = toPlainObject(banner);
  const isLegacyUrl = /^https?:\/\//.test(plain.image);

  return {
    ...plain,
    imageUrl: isLegacyUrl
      ? plain.image
      : getFolderFromBlobName(plain.image)
        ? uploadService.getPublicUrl(plain.image)
        : null,
  };
};

const create = async (payload: CreateBannerInput) => {
  const banner = await BannerModel.create(payload);
  return serialize(banner);
};

const findAll = async (query: BannerQueryInput) => {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;

  const filter = {
    ...(search && {
      title: {
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

  return {
    data: banners.map(serialize),
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

  if (!banner) {
    throw Errors.NotFound("Banner not found");
  }

  return serialize(banner);
};

const update = async ({ id, payload }: UpdateBannerArgs) => {
  const banner = await BannerModel.findById(id);
  if (!banner) {
    throw Errors.NotFound("Banner not found");
  }

  const updatedBanner = await BannerModel.findByIdAndUpdate(id, payload, {
    returnDocument: "after",
    runValidators: true,
  });

  if (!updatedBanner) {
    throw Errors.NotFound("Banner not found");
  }

  return serialize(updatedBanner);
};

const remove = async (id: string) => {
  const banner = await BannerModel.findByIdAndDelete(id, {
    returnDocument: "after",
  });

  if (!banner) {
    throw Errors.NotFound("Banner not found");
  }

  return serialize(banner);
};

export default {
  create,
  findAll,
  findOne,
  update,
  remove,
};
