import mongoose from "mongoose";

const encryptedSubSchema = new mongoose.Schema(
  {
    cipherText: { type: String, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
  },
  { _id: false }
);

const voteSchema = new mongoose.Schema(
  {
    voter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    election: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: true,
      index: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },
    encryptedVote: { type: encryptedSubSchema, required: true },
    encryptedKey: { type: String, required: true },
    hash: { type: String, required: true, index: true },
    previousHash: { type: String },
  },
  { timestamps: true }
);

voteSchema.index({ voter: 1, election: 1 }, { unique: true });

export const Vote = mongoose.model("Vote", voteSchema);


