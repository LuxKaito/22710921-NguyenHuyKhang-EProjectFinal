require("dotenv").config();

const DEFAULT_PORT = 3000;
const DEFAULT_MONGODB_URI = "mongodb://localhost:27017/auth";
const DEFAULT_JWT_SECRET = "secret";

module.exports = {
  port: Number(process.env.PORT) || DEFAULT_PORT,
  mongoURI: process.env.MONGODB_AUTH_URI || DEFAULT_MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
};
