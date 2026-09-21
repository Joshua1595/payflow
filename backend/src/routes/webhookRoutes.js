const express = require("express");

const {
  receiveWebhook,
} = require("../controllers/webhookController");

const router = express.Router();

router.post("/", receiveWebhook);

module.exports = router;