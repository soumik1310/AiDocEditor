import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = user; // available in every controller after this
    next();
  } catch (err) {
    // covers invalid signature, malformed token, and expired token
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default protect;