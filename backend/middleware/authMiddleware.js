const jwt = require("jsonwebtoken");
require('dotenv').config();

const User = require("../models/user");
const verifyToken = async (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).send({ error: "Access denied. No token provided." });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!await User.exists({ _id: decoded.id })) return res.status(401).json({ error: "User no longer exists" });
    req.user = { id: decoded.id };
    next();
  } catch (ex) {
    res.status(401).send({ error: "Invalid token." });
  }
};

module.exports = { verifyToken };