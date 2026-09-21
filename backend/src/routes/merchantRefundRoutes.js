const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getMerchantRefunds,
} = require("../controllers/merchantRefundController");
const {
  getMerchantRefundDetails,
} = require("../controllers/merchantRefundDetailsController");

router.get(
  "/",
  authMiddleware,
  roleMiddleware("merchant"),
  getMerchantRefunds
);
router.get(
  "/:refundId",
  authMiddleware,
  roleMiddleware("merchant"),
  getMerchantRefundDetails
);

module.exports = router;