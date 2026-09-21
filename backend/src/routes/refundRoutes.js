const express = require("express");

const {
  createRefund,
  processRefund,
} = require("../controllers/refundController");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/:paymentId", authenticate, createRefund);
router.post("/:refundId/process", authenticate, processRefund);


module.exports = router;