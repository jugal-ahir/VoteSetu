import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import { DigiLockerCitizen } from "../models/DigiLockerCitizen.js";

dotenv.config();

async function main() {
  await connectDB();

  const sampleRecords = [
    {
      aadhaarId: "123456789012",
      name: "Fairy Patel",
    },
  ];

  for (const rec of sampleRecords) {
    await DigiLockerCitizen.updateOne(
      { aadhaarId: rec.aadhaarId },
      { $set: rec },
      { upsert: true }
    );
  }

  console.log("Seeded DigiLockerCitizen records.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed DigiLocker citizens:", err);
  process.exit(1);
});


