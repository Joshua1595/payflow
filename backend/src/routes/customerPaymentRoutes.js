const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getCustomerPayments,
} = require("../controllers/customerPaymentController");
const {
  getCustomerPaymentDetails,
} = require("../controllers/customerPaymentDetailsController");

router.get(
  "/",
  authMiddleware,
  roleMiddleware("customer"),
  getCustomerPayments
);
router.get(
  "/:paymentId",
  authMiddleware,
  roleMiddleware("customer"),
  getCustomerPaymentDetails
);
module.exports = router;