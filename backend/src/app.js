require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { apiLimiter } = require("./middleware/rateLimitMiddleware");
const authRoutes = require("./routes/authRoutes");
const walletRoutes = require("./routes/walletRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const paymentAttemptRoutes = require("./routes/paymentAttemptRoutes");
const refundRoutes = require("./routes/refundRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const reconciliationRoutes = require("./routes/reconciliationRoutes");
const settlementRoutes = require("./routes/settlementRoutes");
const auditRoutes = require("./routes/auditRoutes");
const merchantDashboardRoutes = require("./routes/merchantDashboardRoutes");
const merchantPaymentRoutes = require("./routes/merchantPaymentRoutes");
const merchantRefundRoutes = require("./routes/merchantRefundRoutes");
const merchantSettlementRoutes = require("./routes/merchantSettlementRoutes");
const merchantActivityRoutes = require("./routes/merchantActivityRoutes");
const customerDashboardRoutes = require("./routes/customerDashboardRoutes");
const customerPaymentRoutes = require("./routes/customerPaymentRoutes");
const customerRefundRoutes = require("./routes/customerRefundRoutes");
const customerTransferRoutes = require("./routes/customerTransferRoutes");
const customerActivityRoutes = require("./routes/customerActivityRoutes");
const customerTransactionRoutes = require("./routes/customerTransactionRoutes");
const merchantTransactionRoutes = require("./routes/merchantTransactionRoutes");
const merchantRoutes = require("./routes/merchantRoutes");
const app = express();

// Middleware
app.use(cors());
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(helmet());
app.use(apiLimiter);
 
app.get("/health", (req, res) => {
  res.send("Welcome to the PayFlow API");
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/payment-attempts", paymentAttemptRoutes);
app.use("/api/refunds", refundRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/reconciliation", reconciliationRoutes);
app.use("/api/settlements", settlementRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/merchant-dashboard", merchantDashboardRoutes);
app.use("/api/merchant/payments",merchantPaymentRoutes);
app.use("/api/merchant/refunds",merchantRefundRoutes);
app.use("/api/merchant/settlements",merchantSettlementRoutes);
app.use("/api/merchant/activity", merchantActivityRoutes);
app.use("/api/customer-dashboard",customerDashboardRoutes);
app.use("/api/customer/payments", customerPaymentRoutes);
app.use("/api/customer/refunds", customerRefundRoutes);
app.use("/api/customer/transfers", customerTransferRoutes);
app.use("/api/customer/activity", customerActivityRoutes);
app.use("/api/customer/transactions", customerTransactionRoutes);
app.use("/api/merchant/transactions", merchantTransactionRoutes);
app.use("/api/merchants",merchantRoutes)
module.exports = app;