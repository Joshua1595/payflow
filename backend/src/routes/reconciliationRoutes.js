const express = require("express");

const {
  reconcileWalletEndpoint,
  reconcileMerchantEndpoint,
  reconcilePaymentsEndpoint,
} = require("../controllers/reconciliationController");
const {
  getSettlementReconciliation,
} = require("../controllers/settlementReconciliationController");

const authenticate = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/wallet",
  authenticate,
  reconcileWalletEndpoint
);

router.get(
  "/merchant",
  authenticate,
  reconcileMerchantEndpoint
);
router.get(
  "/payments",
  authenticate,
  reconcilePaymentsEndpoint
);
router.get(
  "/settlements",
  authenticate,
  roleMiddleware("merchant"),
  getSettlementReconciliation
);
module.exports = router;