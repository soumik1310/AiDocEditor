import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, trim: true, maxlength: 200, default: "Untitled" },
    // TipTap's JSON output is stored as-is, so Mixed (any shape) is used
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ type: "doc", content: [] }),
    },
  },
  { timestamps: true }
);

// Dashboard query: "my docs, most recently edited first".
// One compound index covers both the filter (owner) and the sort (updatedAt).
documentSchema.index({ owner: 1, updatedAt: -1 });

export default mongoose.model("Document", documentSchema);