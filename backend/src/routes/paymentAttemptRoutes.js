const express = require("express");

const {
  getPaymentAttempts,
} = require("../controllers/paymentAttemptController");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:paymentId", authenticate, getPaymentAttempts);

module.exports = router;