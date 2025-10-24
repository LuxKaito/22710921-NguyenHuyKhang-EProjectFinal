const chai = require("chai");
const ProductController = require("../controllers/productController");
const Product = require("../models/product");

const { expect } = chai;

const createResponse = () => {
  const res = {
    statusCalls: [],
    jsonCalls: [],
  };

  res.status = function (code) {
    this.statusCalls.push(code);
    return this;
  };

  res.json = function (payload) {
    this.jsonCalls.push(payload);
    return this;
  };

  return res;
};

describe("ProductController", () => {
  describe("createProduct", () => {
    let originalValidateSync;
    let originalSave;

    beforeEach(() => {
      originalValidateSync = Product.prototype.validateSync;
      originalSave = Product.prototype.save;
    });

    afterEach(() => {
      Product.prototype.validateSync = originalValidateSync;
      Product.prototype.save = originalSave;
    });

    it("should create a new product when the payload is valid", async () => {
      const controller = new ProductController();
      const req = {
        headers: { authorization: "Bearer token" },
        body: {
          name: "Product 1",
          price: 10,
          description: "Description of Product 1",
        },
      };
      const res = createResponse();
      const savedProducts = [];

      Product.prototype.validateSync = () => null;
      Product.prototype.save = async function () {
        savedProducts.push(this);
        return this;
      };

      await controller.createProduct(req, res);

      expect(savedProducts).to.have.lengthOf(1);
      expect(res.statusCalls).to.deep.equal([201]);
      const payload = res.jsonCalls[0];
      expect(payload.name).to.equal("Product 1");
      expect(payload.price).to.equal(10);
      expect(payload.description).to.equal("Description of Product 1");
    });

    it("should return 400 when validation fails", async () => {
      const controller = new ProductController();
      const req = {
        headers: { authorization: "Bearer token" },
        body: {
          price: 10.99,
          description: "Description of Product 1",
        },
      };
      const res = createResponse();

      const validationError = new Error("Product validation failed");
      Product.prototype.validateSync = () => validationError;

      await controller.createProduct(req, res);

      expect(res.statusCalls).to.deep.equal([400]);
      expect(res.jsonCalls).to.deep.equal([{ message: validationError.message }]);
    });

    it("should return 401 when authorization header is missing", async () => {
      const controller = new ProductController();
      const req = {
        headers: {},
        body: {
          name: "Product 1",
          price: 10,
          description: "Description of Product 1",
        },
      };
      const res = createResponse();

      await controller.createProduct(req, res);

      expect(res.statusCalls).to.deep.equal([401]);
      expect(res.jsonCalls).to.deep.equal([{ message: "Unauthorized" }]);
    });
  });
});
