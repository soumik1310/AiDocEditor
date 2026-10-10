export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, next) => {
  // Mongo duplicate key (e.g. two people register the same email at once)
  if (err.code === 11000) {
    return res.status(409).json({ message: "Email is already registered" });
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }

  const status = err.status || 500;
  if (status === 500) console.error(err);

  res.status(status).json({
    message: status === 500 ? "Something went wrong" : err.message,
  });
};