import mongoose from "mongoose";

const electionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "CLOSED"],
      default: "DRAFT",
    },
    startsAt: Date,
    endsAt: Date,
    resultsPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Election = mongoose.model("Election", electionSchema);


