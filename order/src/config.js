require("dotenv").config();

const DEFAULT_PORT = 3002;
const DEFAULT_MONGO_URI = "mongodb://localhost:27017/orders";
const DEFAULT_RABBIT_URI = "amqp://guest:guest@rabbitmq";
const DEFAULT_ORDER_QUEUE = "orders";
const DEFAULT_PRODUCT_QUEUE = "products";
const DEFAULT_JWT_SECRET = "secret";
const DEFAULT_RABBIT_CONNECT_DELAY_MS = 10000;

module.exports = {
  mongoURI: process.env.MONGODB_ORDER_URI || DEFAULT_MONGO_URI,
  rabbitMQURI: process.env.RABBITMQ_URI || DEFAULT_RABBIT_URI,
  orderQueue: process.env.RABBITMQ_ORDER_QUEUE || DEFAULT_ORDER_QUEUE,
  productQueue: process.env.RABBITMQ_PRODUCT_QUEUE || DEFAULT_PRODUCT_QUEUE,
  port: Number(process.env.PORT) || DEFAULT_PORT,
  jwtSecret: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
  rabbitMQConnectDelayMs:
    Number(process.env.RABBITMQ_CONNECT_DELAY_MS) || DEFAULT_RABBIT_CONNECT_DELAY_MS,
};
