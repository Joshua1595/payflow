
const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getMerchantSettlements,
} = require("../controllers/merchantSettlementController");

const {
  getMerchantSettlementDetails,
} = require("../controllers/merchantSettlementDetailsController");

const {
  getSettlementReconciliation,
} = require("../controllers/settlementReconciliationController");

// Get all merchant settlements
router.get(
  "/",
  authMiddleware,
  roleMiddleware("merchant"),
  getMerchantSettlements
);

// Get merchant settlement reconciliation
// IMPORTANT: This must come before /:settlementId
router.get(
  "/reconciliation",
  authMiddleware,
  roleMiddleware("merchant"),
  getSettlementReconciliation
);

// Get a specific settlement
router.get(
  "/:settlementId",
  authMiddleware,
  roleMiddleware("merchant"),
  getMerchantSettlementDetails
);

module.exports = router;

