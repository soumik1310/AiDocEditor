import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, trim: true, maxlength: 200, default: "Untitled" },
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ type: "doc", content: [] }),
    },
    isShared: { type: Boolean, default: false },
    shareId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

documentSchema.index({ owner: 1, updatedAt: -1 });

export default mongoose.model("Document", documentSchema);