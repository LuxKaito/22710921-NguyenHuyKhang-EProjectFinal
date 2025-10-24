const chai = require("chai");
const AuthController = require("../controllers/authController");

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

describe("AuthController", () => {
  describe("register", () => {
    it("should register a new user when username is available", async () => {
      const controller = new AuthController();
      controller.authService = {
        findUserByUsername: async () => null,
        register: async (user) => ({ _id: "123", username: user.username }),
      };
      const req = {
        body: { username: "testuser", password: "password" },
      };
      const res = createResponse();

      await controller.register(req, res);

      expect(res.statusCalls).to.be.empty;
      expect(res.jsonCalls).to.have.lengthOf(1);
      expect(res.jsonCalls[0]).to.deep.equal({
        _id: "123",
        username: "testuser",
      });
    });

    it("should return 400 if username already exists", async () => {
      const controller = new AuthController();
      controller.authService = {
        findUserByUsername: async () => ({ _id: "existing", username: "testuser" }),
        register: async () => {
          throw new Error("Should not be called");
        },
      };
      const req = {
        body: { username: "testuser", password: "password" },
      };
      const res = createResponse();

      await controller.register(req, res);

      expect(res.statusCalls).to.deep.equal([400]);
      expect(res.jsonCalls).to.have.lengthOf(1);
      expect(res.jsonCalls[0]).to.deep.equal({
        message: "Username already taken",
      });
    });
  });

  describe("login", () => {
    it("should return a JWT token for a valid user", async () => {
      const controller = new AuthController();
      controller.authService = {
        login: async () => ({ success: true, token: "jwt-token" }),
      };
      const req = {
        body: { username: "testuser", password: "password" },
      };
      const res = createResponse();

      await controller.login(req, res);

      expect(res.statusCalls).to.be.empty;
      expect(res.jsonCalls).to.deep.equal([{ token: "jwt-token" }]);
    });

    it("should return 400 for an invalid user", async () => {
      const controller = new AuthController();
      controller.authService = {
        login: async () => ({
          success: false,
          message: "Invalid username or password",
        }),
      };
      const req = {
        body: { username: "invaliduser", password: "password" },
      };
      const res = createResponse();

      await controller.login(req, res);

      expect(res.statusCalls).to.deep.equal([400]);
      expect(res.jsonCalls).to.deep.equal([
        { message: "Invalid username or password" },
      ]);
    });

    it("should return 400 for an incorrect password", async () => {
      const controller = new AuthController();
      controller.authService = {
        login: async () => ({
          success: false,
          message: "Invalid username or password",
        }),
      };
      const req = {
        body: { username: "testuser", password: "wrongpassword" },
      };
      const res = createResponse();

      await controller.login(req, res);

      expect(res.statusCalls).to.deep.equal([400]);
      expect(res.jsonCalls).to.deep.equal([
        { message: "Invalid username or password" },
      ]);
    });
  });
});
