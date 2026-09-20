import mongoose from "mongoose";

export interface Banner {
  title: string;
  image: string;
  isShow: boolean;
}

const BannerSchema = new mongoose.Schema<Banner>(
  {
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    isShow: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const BannerModel = mongoose.model("Banner", BannerSchema);
