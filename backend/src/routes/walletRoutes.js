const express = require("express");

const {
  getWallet,
  depositMoney,
  withdrawMoney,
  transferMoney,
} = require("../controllers/walletController");
const { getLedger,verifyLedger } = require("../controllers/ledgerController");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticate, getWallet);
router.post("/deposit", authenticate, depositMoney);
router.post("/withdraw", authenticate, withdrawMoney);
router.post("/transfer", authenticate, transferMoney);
router.get("/ledger", authenticate, getLedger);
router.get("/ledger/verify", authenticate, verifyLedger);

module.exports = router;