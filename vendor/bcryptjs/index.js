const crypto = require("crypto");

function genSalt(rounds, callback) {
  if (typeof rounds === "function") {
    callback = rounds;
    rounds = undefined;
  }

  const promise = new Promise((resolve, reject) => {
    crypto.randomBytes(16, (err, buf) => {
      if (err) {
        reject(err);
        return;
      }

      const workFactor =
        typeof rounds === "number" && Number.isFinite(rounds) && rounds > 0
          ? Math.min(Math.floor(rounds), 31)
          : 10;
      const prefix = workFactor.toString(16).padStart(2, "0");
      resolve(`${prefix}${buf.toString("hex")}`);
    });
  });

  if (typeof callback === "function") {
    promise.then((salt) => callback(null, salt)).catch(callback);
    return;
  }

  return promise;
}

function genSaltSync(rounds) {
  const buf = crypto.randomBytes(16);
  const workFactor =
    typeof rounds === "number" && Number.isFinite(rounds) && rounds > 0
      ? Math.min(Math.floor(rounds), 31)
      : 10;
  const prefix = workFactor.toString(16).padStart(2, "0");
  return `${prefix}${buf.toString("hex")}`;
}

function hash(data, salt, callback) {
  if (typeof salt === "function") {
    callback = salt;
    salt = undefined;
  }

  const promise = (async () => {
    if (typeof salt === "number") {
      salt = await genSalt(salt);
    }

    if (typeof salt !== "string" || salt.length === 0) {
      throw new Error("Salt must be a non-empty string");
    }

    const derivedKey = await new Promise((resolve, reject) => {
      crypto.scrypt(data, salt, 64, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });

    return `${salt}$${derivedKey.toString("hex")}`;
  })();

  if (typeof callback === "function") {
    promise.then((hashValue) => callback(null, hashValue)).catch(callback);
    return;
  }

  return promise;
}

function hashSync(data, salt) {
  if (typeof salt === "number") {
    salt = genSaltSync(salt);
  }

  if (typeof salt !== "string" || salt.length === 0) {
    throw new Error("Salt must be a non-empty string");
  }

  const derivedKey = crypto.scryptSync(data, salt, 64);
  return `${salt}$${derivedKey.toString("hex")}`;
}

function compare(data, encrypted, callback) {
  const promise = new Promise((resolve, reject) => {
    if (typeof encrypted !== "string") {
      reject(new Error("Encrypted value must be a string"));
      return;
    }

    const [salt, storedHash] = encrypted.split("$");

    if (!salt || !storedHash) {
      resolve(false);
      return;
    }

    crypto.scrypt(data, salt, 64, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }

      const computed = derivedKey.toString("hex");
      const storedBuffer = Buffer.from(storedHash, "hex");
      const computedBuffer = Buffer.from(computed, "hex");

      if (storedBuffer.length !== computedBuffer.length) {
        resolve(false);
        return;
      }

      const match = crypto.timingSafeEqual(storedBuffer, computedBuffer);
      resolve(match);
    });
  });

  if (typeof callback === "function") {
    promise.then((match) => callback(null, match)).catch(callback);
    return;
  }

  return promise;
}

function compareSync(data, encrypted) {
  if (typeof encrypted !== "string") {
    throw new Error("Encrypted value must be a string");
  }

  const [salt, storedHash] = encrypted.split("$");
  if (!salt || !storedHash) {
    return false;
  }

  const derivedKey = crypto.scryptSync(data, salt, 64).toString("hex");
  const storedBuffer = Buffer.from(storedHash, "hex");
  const computedBuffer = Buffer.from(derivedKey, "hex");

  if (storedBuffer.length !== computedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, computedBuffer);
}

module.exports = {
  genSalt,
  genSaltSync,
  hash,
  hashSync,
  compare,
  compareSync,
};
