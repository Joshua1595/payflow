const express = require("express");

const {
  getTransactions,
  getTransactionById,
} = require("../controllers/transactionController");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticate, getTransactions);
router.get("/:transactionId", authenticate, getTransactionById);

module.exports = router;