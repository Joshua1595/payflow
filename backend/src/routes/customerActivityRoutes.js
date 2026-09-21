const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getCustomerActivity,
} = require("../controllers/customerActivityController");

router.get(
  "/",
  authMiddleware,
  roleMiddleware("customer"),
  getCustomerActivity
);

module.exports = router;