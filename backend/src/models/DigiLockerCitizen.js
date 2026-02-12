import mongoose from "mongoose";

const digiCitizenSchema = new mongoose.Schema(
  {
    aadhaarId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export const DigiLockerCitizen = mongoose.model(
  "DigiLockerCitizen",
  digiCitizenSchema
);


