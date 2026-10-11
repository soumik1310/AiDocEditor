import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // stores the bcrypt HASH, never the plain password
    // loaded in every query, so never send a user document straight to res.json
    password: { type: String, required: true },
    // sha256 hash of the user's CURRENT refresh token (null = logged out)
    refreshTokenHash: { type: String, default: null },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

export default mongoose.model("User", userSchema);