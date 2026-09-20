import mongoose from "mongoose";

import { DATABASE_URL } from "./env";

const connectToDatabase = async () => {
  try {
    await mongoose.connect(DATABASE_URL, {
      dbName: "samaya",
    });
    return Promise.resolve("Database connection successful");
  } catch (error) {
    return Promise.reject(error);
  }
};

export default connectToDatabase;
