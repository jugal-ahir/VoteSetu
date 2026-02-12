import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/votesetu";

export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      autoIndex: true,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error", err);
    throw err;
  }
}


