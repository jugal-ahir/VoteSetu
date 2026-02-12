import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    election: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    party: String,
    manifesto: String,
  },
  { timestamps: true }
);

export const Candidate = mongoose.model("Candidate", candidateSchema);


