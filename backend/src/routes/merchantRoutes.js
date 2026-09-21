
const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getActiveMerchants,
} = require("../controllers/merchantController");

router.get(
  "/",
  authMiddleware,
  getActiveMerchants
);

module.exports = router;

