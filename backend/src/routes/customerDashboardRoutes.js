const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getCustomerDashboard,
} = require("../controllers/customerDashboardController");

router.get(
  "/",
  authMiddleware,
  roleMiddleware("customer"),
  getCustomerDashboard
);

module.exports = router;