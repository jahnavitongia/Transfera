const jwt = require("jsonwebtoken");
const User = require("../models/user");

const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Please sign in to continue" });
  }
  let decoded;
  try {
    decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Your session has expired. Please sign in again" });
  }
  try {
    const user = await User.findById(decoded.id).select("name email role");
    if (!user) return res.status(401).json({ message: "Account no longer exists" });
    req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    next();
  } catch (error) {
    next(error);
  }
};

const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Your account cannot perform this action" });
  }
  next();
};

module.exports = protect;
module.exports.allowRoles = allowRoles;
