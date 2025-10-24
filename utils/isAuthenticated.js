const jwt = require("jsonwebtoken");
require("dotenv").config();

const DEFAULT_JWT_SECRET = "secret";

function isAuthenticated(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;

  try {
    const decodedToken = jwt.verify(token, secret);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = isAuthenticated;
