const crypto = require("crypto");

const createRequestHash = (body) => {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(body || {}))
    .digest("hex");
};

const getIdempotencyKey = (req) => {
  return req.headers["idempotency-key"];
};

module.exports = {
  createRequestHash,
  getIdempotencyKey,
};