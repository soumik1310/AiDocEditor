import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

// small helper so we can throw errors with a status code
const httpError = (status, message) =>
  Object.assign(new Error(message), { status });

const signAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  });

// only these fields are allowed to leave the server
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

// POST /api/auth/register
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw httpError(400, "Name, email and password are required");
  }
  if (password.length < 6) {
    throw httpError(400, "Password must be at least 6 characters");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw httpError(409, "Email is already registered");

  // we hash the password before it goes to the db
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword });

  res.status(201).json({
    accessToken: signAccessToken(user._id),
    user: publicUser(user),
  });
};

// POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw httpError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // same message for "no user" and "wrong password" on purpose
  if (!user || !(await user.comparePassword(password))) {
    throw httpError(401, "Invalid email or password");
  }

  res.json({
    accessToken: signAccessToken(user._id),
    user: publicUser(user),
  });
};

// GET /api/auth/me  (protected)
export const getMe = async (req, res) => {
  res.json({ user: publicUser(req.user) });
};