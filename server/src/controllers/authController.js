import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

// small helper so we can throw errors with a status code
const httpError = (status, message) =>
  Object.assign(new Error(message), { status });

const REFRESH_COOKIE = "refreshToken";

// cookie settings: JS can't read it, and it is only sent to /api/auth routes
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, same as the token
};

const signAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  });

// jwtid makes every refresh token unique, even if two are created in the same second
const signRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
    jwtid: crypto.randomUUID(),
  });

// we store only a hash of the refresh token, like a password
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

// only these fields are allowed to leave the server
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

// creates a new refresh token, saves its hash, sets the cookie,
// and returns a new access token. Used by register, login and refresh.
const issueTokens = async (user, res) => {
  const refreshToken = signRefreshToken(user._id);
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  return signAccessToken(user._id);
};

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

  const accessToken = await issueTokens(user, res);
  res.status(201).json({ accessToken, user: publicUser(user) });
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

  const accessToken = await issueTokens(user, res);
  res.json({ accessToken, user: publicUser(user) });
};

// POST /api/auth/refresh  (reads the refresh cookie, no access token needed)
export const refresh = async (req, res) => {
  const token = req.cookies[REFRESH_COOKIE];
  if (!token) throw httpError(401, "No refresh token");

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw httpError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decoded.id);

  // the token must match the one we stored. An old (already rotated)
  // token or a logged-out user fails here.
  if (!user || user.refreshTokenHash !== hashToken(token)) {
    res.clearCookie(REFRESH_COOKIE, cookieOptions);
    throw httpError(401, "Refresh token is no longer valid");
  }

  // rotation: issue a NEW refresh token, the old one stops working
  const accessToken = await issueTokens(user, res);
  res.json({ accessToken, user: publicUser(user) });
};

// POST /api/auth/logout  (public on purpose: the access token may be expired)
export const logout = async (req, res) => {
  const token = req.cookies[REFRESH_COOKIE];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      await User.findByIdAndUpdate(decoded.id, { refreshTokenHash: null });
    } catch (err) {
      // token already invalid, nothing to revoke
    }
  }

  res.clearCookie(REFRESH_COOKIE, cookieOptions);
  res.json({ message: "Logged out" });
};

// GET /api/auth/me  (protected)
export const getMe = async (req, res) => {
  res.json({ user: publicUser(req.user) });
};