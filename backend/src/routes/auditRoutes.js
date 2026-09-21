const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  getAuditHistory,
} = require("../controllers/auditController");

router.get(
  "/",
  authMiddleware,
  getAuditHistory
);

module.exports = router;