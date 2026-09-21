const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getMerchantPayments,
} = require("../controllers/merchantPaymentController");
const {
  getMerchantPaymentDetails,
} = require("../controllers/merchantPaymentDetailsController");

router.get(
  "/",
  authMiddleware,
  roleMiddleware("merchant"),
  getMerchantPayments
);
router.get(
  "/:paymentId",
  authMiddleware,
  roleMiddleware("merchant"),
  getMerchantPaymentDetails
);

module.exports = router;