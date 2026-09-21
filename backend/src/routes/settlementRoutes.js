const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  requestSettlement,
  processSettlementRequest,
  failSettlementRequest,
  getSettlementHistory,
} = require("../controllers/settlementController");

router.post(
  "/",
  authMiddleware,
  roleMiddleware("merchant"),
  requestSettlement
);
router.post(
  "/:settlementId/process",
  authMiddleware,
  roleMiddleware("merchant"),
  processSettlementRequest
);
router.post(
  "/:settlementId/fail",
  authMiddleware,
  roleMiddleware("merchant"),
  failSettlementRequest
);
router.get(
  "/",
  authMiddleware,
  roleMiddleware("merchant"),
  getSettlementHistory
);

module.exports = router;