
const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getCustomerTransfers,
  sendMoney,
  getCustomerTransferDetails,
  findReceiver ,
} = require("../controllers/customerTransferController");

// Transfer history
router.get(
  "/",
  authMiddleware,
  roleMiddleware("customer"),
  getCustomerTransfers
);

// Send money
router.post(
  "/",
  authMiddleware,
  roleMiddleware("customer"),
  sendMoney
);
router.get(
  "/receiver",
  authMiddleware,
  roleMiddleware("customer"),
  findReceiver
);
// Transfer details
router.get(
  "/:transferId",
  authMiddleware,
  roleMiddleware("customer"),
  getCustomerTransferDetails
);


module.exports = router;

