const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getMerchantActivity,
} = require("../controllers/merchantActivityController");

router.get(
  "/",
  authMiddleware,
  roleMiddleware("merchant"),
  getMerchantActivity
);

module.exports = router;