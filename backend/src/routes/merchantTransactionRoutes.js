const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getMerchantTransactions,
} = require("../controllers/merchantTransactionController");

router.get(
  "/",
  authMiddleware,
  roleMiddleware("merchant"),
  getMerchantTransactions
);

module.exports = router;