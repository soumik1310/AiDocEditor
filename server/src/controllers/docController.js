import mongoose from "mongoose";
import Document from "../models/Document.js";

const httpError = (status, message) =>
  Object.assign(new Error(message), { status });

// POST /api/docs
export const createDoc = async (req, res) => {
  const { title, content } = req.body;

  const doc = await Document.create({
    owner: req.user._id,
    title: title?.trim() || "Untitled",
    ...(content && { content }), // only set if the client sent it
  });

  res.status(201).json({ doc });
};

// GET /api/docs?page=1&limit=10
export const listDocs = async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

  const filter = { owner: req.user._id };

  const [docs, total] = await Promise.all([
    Document.find(filter)
      .select("title createdAt updatedAt") // the list doesn't need the content
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Document.countDocuments(filter),
  ]);

  res.json({
    docs,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
};

// GET /api/docs/:id
export const getDoc = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) throw httpError(404, "Document not found");

  // filtering by owner here means other people's docs look like "not found"
  const doc = await Document.findOne({ _id: id, owner: req.user._id });
  if (!doc) throw httpError(404, "Document not found");

  res.json({ doc });
};