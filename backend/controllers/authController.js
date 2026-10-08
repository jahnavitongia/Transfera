const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role });

const createAccount = async (req, res, role) => {
  const { name, email, password } = req.body;
  if (typeof name !== "string" || !name.trim() || typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ message: "Enter a name, valid email, and password of at least 8 characters" });
  }
  try {
    const user = await User.create({
      name: name.trim(), email: email.trim().toLowerCase(),
      password: await bcrypt.hash(password, 12), role,
    });
    res.status(201).json({ message: "Account created successfully", user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "An account with this email already exists" });
    console.error("Create account:", error);
    res.status(500).json({ message: "Unable to create account" });
  }
};

// Public registration always creates a student, regardless of submitted role.
const registerUser = (req, res) => createAccount(req, res, "student");
const createStaff = (req, res) => createAccount(req, res, "staff");

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" });
    res.json({ token, user: publicUser(user) });
  } catch (error) {
    console.error("Login:", error);
    res.status(500).json({ message: "Unable to sign in" });
  }
};

const getAccount = (req, res) => res.json({ user: req.user });
const listStaff = async (req, res, next) => {
  try {
    const users = await User.find({ role: "staff" }).select("name email role").sort({ name: 1 });
    res.json({ users: users.map(publicUser) });
  } catch (error) { next(error); }
};
module.exports = { registerUser, loginUser, getAccount, createStaff, listStaff };
