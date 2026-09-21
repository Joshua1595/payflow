const express = require("express");

const {
  createPayment,
  processPayment,
  getPaymentById,
} = require("../controllers/paymentController");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticate, createPayment);
router.post("/:paymentId/process", authenticate, processPayment);
router.get("/:paymentId", authenticate, getPaymentById);

module.exports = router;