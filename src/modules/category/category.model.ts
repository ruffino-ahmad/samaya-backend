import mongoose, { Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  description: string;
  icon: string;
}

const CategorySchema = new mongoose.Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const CategoryModel = mongoose.model("Category", CategorySchema);

export default CategoryModel;
