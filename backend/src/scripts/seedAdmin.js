import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";

dotenv.config();

async function main() {
  await connectDB();

  const email = "jugal@gov.in";
  const voterId = "ADMIN-ECI-0001";
  const name = "Election Commissioner Jugal";
  const plainPassword = "Admin@123";

  const passwordHash = await bcrypt.hash(plainPassword, 12);

  const existing = await User.findOne({ email });

  if (existing) {
    existing.passwordHash = passwordHash;
    existing.role = "admin";
    existing.voterId = existing.voterId || voterId;
    await existing.save();
    console.log("Updated existing admin user:", email);
  } else {
    await User.create({
      name,
      email,
      voterId,
      passwordHash,
      role: "admin",
    });
    console.log("Created admin user:", email);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to seed admin:", err);
  process.exit(1);
});


