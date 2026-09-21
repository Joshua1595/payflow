const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getCustomerRefunds,
} = require("../controllers/customerRefundController");
const {
  getCustomerRefundDetails,
} = require("../controllers/customerRefundDetailsController");

router.get(
  "/",
  authMiddleware,
  roleMiddleware("customer"),
  getCustomerRefunds
);
router.get(
  "/:refundId",
  authMiddleware,
  roleMiddleware("customer"),
  getCustomerRefundDetails
);
module.exports = router;