const express = require("express");
const ProductController = require("../controllers/productController");
const isAuthenticated = require("../utils/isAuthenticated");

const router = express.Router();
const productController = new ProductController();

router.post("/", isAuthenticated, (req, res, next) => {
  console.log("[PRODUCT] POST / - createProduct called");
  next(); 
}, productController.createProduct);

router.post("/buy", isAuthenticated, (req, res, next) => {
  console.log("[PRODUCT] POST /buy - createOrder called");
  next();
}, productController.createOrder);

router.get("/", isAuthenticated, (req, res, next) => {
  console.log("[PRODUCT] GET / - getProducts called");
  next();
}, productController.getProducts);

module.exports = router;
