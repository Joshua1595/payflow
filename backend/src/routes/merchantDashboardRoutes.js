const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getMerchantDashboard,
} = require("../controllers/merchantDashboardController");

router.get(
  "/",
  authMiddleware,
  roleMiddleware("merchant"),
  getMerchantDashboard
);

module.exports = router;