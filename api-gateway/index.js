const express = require("express");
const httpProxy = require("http-proxy");

const proxy = httpProxy.createProxyServer();
const app = express();

const AUTH_SERVICE_HOST = process.env.AUTH_SERVICE_HOST || "auth";
const AUTH_SERVICE_PORT = process.env.AUTH_SERVICE_PORT || "3000";
const PRODUCT_SERVICE_HOST = process.env.PRODUCT_SERVICE_HOST || "product";
const PRODUCT_SERVICE_PORT = process.env.PRODUCT_SERVICE_PORT || "3001";
const ORDER_SERVICE_HOST = process.env.ORDER_SERVICE_HOST || "order";
const ORDER_SERVICE_PORT = process.env.ORDER_SERVICE_PORT || "3002";

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || `http://${AUTH_SERVICE_HOST}:${AUTH_SERVICE_PORT}`;
const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL ||
  `http://${PRODUCT_SERVICE_HOST}:${PRODUCT_SERVICE_PORT}`;
const ORDER_SERVICE_URL =
process.env.ORDER_SERVICE_URL || `http://${ORDER_SERVICE_HOST}:${ORDER_SERVICE_PORT}`;

proxy.on("error", (err, req, res) => {
  console.error("Proxy error:", err.message);
  if (!res.headersSent) {
    res.status(502).json({ message: "Service unavailable" });
  }
});

// Route requests to the auth service
app.use("/auth", (req, res) => {
  proxy.web(req, res, { target: AUTH_SERVICE_URL });
});

// Route requests to the product service
app.use("/products", (req, res) => {
  proxy.web(req, res, { target: PRODUCT_SERVICE_URL });
});

// Route requests to the order service
app.use("/orders", (req, res) => {
  proxy.web(req, res, { target: ORDER_SERVICE_URL });
});

// Start the server
const port = Number(process.env.PORT) || 3003;
app.listen(port, () => {
  console.log(`API Gateway listening on port ${port}`);
});
