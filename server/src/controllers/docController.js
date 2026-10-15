import Document from "../models/Document.js";
import crypto from "crypto";
const httpError = (status, message) =>
    Object.assign(new Error(message), { status });

// POST /api/docs
export const createDoc = async (req, res) => {
    const { title, content } = req.body;

    const data = {
        owner: req.user._id,
        title: title?.trim() || "Untitled",
    };
    if (content) data.content = content;

    const doc = await Document.create(data);

    res.status(201).json({ doc });
};

// GET /api/docs?page=1&limit=10

export const listDocs = async (req, res) => {
  let page = parseInt(req.query.page);
  let limit = parseInt(req.query.limit);

  // page: default 1, never below 1
  if (!page || page < 1) page = 1;

  // limit: default 10, never below 1, never above 50
  if (!limit || limit < 1) limit = 10;
  if (limit > 50) limit = 50;

  const filter = { owner: req.user._id };

  const [docs, total] = await Promise.all([
    Document.find(filter)
      .select("title createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Document.countDocuments(filter),
  ]);

  res.json({ docs, page, limit, total, totalPages: Math.ceil(total / limit) });
};

// GET /api/docs/:id
export const getDoc = async (req, res) => {
    const doc = await Document.findOne({
        _id: req.params.id,
        owner: req.user._id,
    });
    if (!doc) throw httpError(404, "Document not found");

    res.json({ doc });
};

// PUT /api/docs/:id
export const updateDoc = async (req, res) => {
    const { title, content } = req.body;

    const doc = await Document.findOne({
        _id: req.params.id,
        owner: req.user._id,
    });
    if (!doc) throw httpError(404, "Document not found");

    if (title !== undefined) doc.title = title;
    if (content !== undefined) doc.content = content;

    await doc.save();
    res.json({ doc });
};

// DELETE /api/docs/:id
export const deleteDoc = async (req, res) => {
    const doc = await Document.findOneAndDelete({
        _id: req.params.id,
        owner: req.user._id,
    });
    if (!doc) throw httpError(404, "Document not found");

    res.json({ message: "Document deleted" });
};
// PATCH /api/docs/:id/share  (flips sharing on/off)
export const toggleShare = async (req, res) => {
  const doc = await Document.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });
  if (!doc) throw httpError(404, "Document not found");

  doc.isShared = !doc.isShared;

  // create the shareId only once, so the link stays the same
  if (doc.isShared && !doc.shareId) {
    doc.shareId = crypto.randomBytes(12).toString("hex");
  }

  await doc.save();
  res.json({ isShared: doc.isShared, shareId: doc.shareId });
};

// GET /api/public/:shareId  (no login)
export const getPublicDoc = async (req, res) => {
  const doc = await Document.findOne({
    shareId: req.params.shareId,
    isShared: true,
  }).select("title content updatedAt");
  if (!doc) throw httpError(404, "Document not found");

  res.json({ doc });
};