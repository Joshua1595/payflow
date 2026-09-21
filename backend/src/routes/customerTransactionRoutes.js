const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getCustomerTransactions,
} = require("../controllers/customerTransactionController");
const {
  getCustomerTransactionDetails,
} = require("../controllers/customerTransactionDetailsController");

router.get(
  "/",
  authMiddleware,
  roleMiddleware("customer"),
  getCustomerTransactions
);
router.get(
  "/:transactionId",
  authMiddleware,
  roleMiddleware("customer"),
  getCustomerTransactionDetails
);

module.exports = router;