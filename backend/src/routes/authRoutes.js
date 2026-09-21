const express = require("express");

const {
  register,
  login,
  getMe,
} = require("../controllers/authController");
const {
  authLimiter,
} = require("../middleware/rateLimitMiddleware");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", authLimiter, login);
router.get("/me", authenticate, getMe);
router.get(
  "/customer-area",
  authenticate,
  authorize("customer"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome to the customer area",
      user: req.user,
    });
  }
);

router.get(
  "/merchant-area",
  authenticate,
  authorize("merchant"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome to the merchant area",
      user: req.user,
    });
  }
);

router.get(
  "/admin-area",
  authenticate,
  authorize("admin"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome to the admin area",
      user: req.user,
    });
  }
);
module.exports = router;