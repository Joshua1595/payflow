# PayFlow API Documentation

## Full-Stack Payment Gateway & Digital Wallet Platform

PayFlow is a full-stack payment platform that provides digital wallets, customer-to-merchant payments, wallet transfers, refunds, merchant settlements, reconciliation, webhooks, audit logging, authentication, authorization, and transaction tracking.

---

# 1. Technology Stack

- Node.js
- Express.js
- PostgreSQL
- Supabase PostgreSQL
- JWT Authentication
- bcrypt Password Hashing
- Helmet
- CORS
- express-rate-limit
- Jest
- Supertest

---

# 2. Base URL

Development:

```text
http://localhost:5000
```

---

# 3. API Response Format

Successful responses generally use:

```json
{
  "success": true,
  "message": "Operation completed successfully"
}
```

Error responses generally use:

```json
{
  "success": false,
  "message": "Error description"
}
```

---

# 4. Authentication

Protected endpoints use JWT authentication.

### Authorization Header

```http
Authorization: Bearer <JWT_TOKEN>
```

Example:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Authentication Errors

Missing token:

```http
401 Unauthorized
```

```json
{
  "success": false,
  "message": "Authorization token is required"
}
```

Invalid or expired token:

```http
401 Unauthorized
```

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

---

# 5. User Roles

PayFlow supports the following roles:

| Role       | Description                                        |
| ---------- | -------------------------------------------------- |
| `customer` | Uses wallets, payments, transfers, and refunds     |
| `merchant` | Receives payments and manages merchant settlements |
| `admin`    | Administrative role                                |

---

# 6. Health Check

## Get API Health

```http
GET /health
```

Authentication:

```text
Public
```

Response:

```text
Welcome to the PayFlow API
```

---

# 7. Authentication Endpoints

## Register

```http
POST /api/auth/register
```

Authentication:

```text
Public
```

Creates a new PayFlow user.

### Example Request

```json
{
  "name": "Eyasu",
  "email": "eyasu@example.com",
  "password": "Password123",
  "role": "customer"
}
```

---

## Login

```http
POST /api/auth/login
```

Authentication:

```text
Public
```

The login endpoint is protected by authentication rate limiting.

### Example Request

```json
{
  "email": "eyasu@example.com",
  "password": "Password123"
}
```

The response contains a JWT access token.

The token is then used with:

```http
Authorization: Bearer <JWT_TOKEN>
```

---

## Get Current User

```http
GET /api/auth/me
```

Authentication:

```text
Required
```

Returns information about the authenticated user.

---

## Customer Area

```http
GET /api/auth/customer-area
```

Authentication:

```text
Required
```

Role:

```text
customer
```

Example response:

```json
{
  "success": true,
  "message": "Welcome to the customer area",
  "user": {}
}
```

---

## Merchant Area

```http
GET /api/auth/merchant-area
```

Authentication:

```text
Required
```

Role:

```text
merchant
```

---

## Admin Area

```http
GET /api/auth/admin-area
```

Authentication:

```text
Required
```

Role:

```text
admin
```

---

# 8. Wallet API

Wallet operations are authenticated and operate on the wallet belonging to the authenticated user.

---

## Get Wallet

```http
GET /api/wallet
```

Authentication:

```text
Required
```

Returns the authenticated user's wallet.

Typical wallet information includes:

```json
{
  "id": "WALLET_ID",
  "user_id": "USER_ID",
  "balance": "80.00",
  "currency": "ETB",
  "status": "active"
}
```

---

## Deposit

```http
POST /api/wallet/deposit
```

Authentication:

```text
Required
```

### Example Request

```json
{
  "amount": 100
}
```

The deposit operation:

1. Validates the amount.
2. Locks the wallet.
3. Increases the wallet balance.
4. Creates a completed transaction.
5. Creates a ledger credit entry.
6. Creates an audit log.

Deposit transaction references use:

```text
DEP-
```

---

## Withdraw

```http
POST /api/wallet/withdraw
```

Authentication:

```text
Required
```

### Example Request

```json
{
  "amount": 20
}
```

The withdrawal operation:

1. Validates the amount.
2. Locks the wallet.
3. Checks that the wallet is active.
4. Checks available balance.
5. Decreases the wallet balance.
6. Creates a completed transaction.
7. Creates a ledger debit entry.
8. Creates an audit log.

Insufficient balance:

```json
{
  "success": false,
  "message": "Insufficient wallet balance"
}
```

Withdrawal transaction references use:

```text
WTH-
```

---

## Transfer

```http
POST /api/wallet/transfer
```

Authentication:

```text
Required
```

### Example Request

```json
{
  "receiverEmail": "receiver@test.com",
  "amount": 10
}
```

The transfer operation:

1. Identifies the sender wallet.
2. Identifies the receiver wallet.
3. Prevents self-transfer.
4. Locks both wallets.
5. Checks wallet status.
6. Checks currency.
7. Checks sender balance.
8. Debits the sender wallet.
9. Credits the receiver wallet.
10. Creates a wallet transfer record.
11. Creates debit and credit ledger entries.
12. Creates audit records.

Transfer references use:

```text
TRF-
```

---

## Get Wallet Ledger

```http
GET /api/wallet/ledger
```

Authentication:

```text
Required
```

Returns ledger entries associated with the authenticated user's wallet.

---

## Verify Wallet Ledger

```http
GET /api/wallet/ledger/verify
```

Authentication:

```text
Required
```

Verifies whether the wallet balance agrees with the balance calculated from ledger entries.

This provides an accounting consistency check.

---

# 9. Customer API

Customer endpoints are restricted to the authenticated customer and their own resources.

---

## Customer Dashboard

```http
GET /api/customer-dashboard
```

Authentication:

```text
Required
```

Role:

```text
customer
```

Returns customer dashboard information.

---

## Customer Payments

```http
GET /api/customer/payments
```

Authentication:

```text
Required
```

Role:

```text
customer
```

Returns payments belonging to the authenticated customer.

---

## Customer Payment Details

```http
GET /api/customer/payments/:paymentId
```

Authentication:

```text
Required
```

Role:

```text
customer
```

Customers can only access their own payments.

Unauthorized access to another customer's payment returns:

```http
404 Not Found
```

```json
{
  "success": false,
  "message": "Payment not found"
}
```

---

## Customer Refunds

```http
GET /api/customer/refunds
```

Authentication:

```text
Required
```

Role:

```text
customer
```

Returns refunds belonging to the authenticated customer.

---

## Customer Refund Details

```http
GET /api/customer/refunds/:refundId
```

Authentication:

```text
Required
```

Role:

```text
customer
```

Customers can only access their own refunds.

---

## Customer Transactions

```http
GET /api/customer/transactions
```

Authentication:

```text
Required
```

Role:

```text
customer
```

Returns transactions belonging to the authenticated customer.

---

## Customer Transaction Details

```http
GET /api/customer/transactions/:transactionId
```

Authentication:

```text
Required
```

Role:

```text
customer
```

Customers can only access their own transactions.

Unauthorized access returns:

```http
404 Not Found
```

```json
{
  "success": false,
  "message": "Transaction not found"
}
```

---

## Customer Transfers

```http
GET /api/customer/transfers
```

Authentication:

```text
Required
```

Role:

```text
customer
```

Returns transfers associated with the customer's wallet.

### Sent Transfers

```http
GET /api/customer/transfers?direction=sent
```

### Received Transfers

```http
GET /api/customer/transfers?direction=received
```

---

## Customer Activity

```http
GET /api/customer/activity
```

Authentication:

```text
Required
```

Role:

```text
customer
```

Returns customer activity history.

---

# 10. Payment API

Payments represent customer-to-merchant payment operations.

---

## Create Payment

```http
POST /api/payments
```

Authentication:

```text
Required
```

### Example Request

```json
{
  "merchantId": "MERCHANT_ID",
  "amount": 100,
  "currency": "ETB"
}
```

Validation includes:

* Merchant ID must be provided.
* Amount must be positive.
* Amount must be finite.
* Currency must be supported.

A payment is initially created without moving money.

Payment references use:

```text
PAY-
```

---

## Process Payment

```http
POST /api/payments/:paymentId/process
```

Authentication:

```text
Required
```

### Required Header

```http
Idempotency-Key: unique-request-key
```

The payment processing flow:

1. Validates the idempotency key.
2. Checks for previous requests.
3. Detects idempotency conflicts.
4. Locks the payment.
5. Verifies customer ownership.
6. Locks the customer wallet.
7. Checks wallet status.
8. Checks currency.
9. Checks sufficient funds.
10. Locks the merchant account.
11. Checks merchant account status.
12. Checks currency.
13. Debits the customer wallet.
14. Credits the merchant account.
15. Creates the payment transaction.
16. Creates the customer ledger entry.
17. Creates the payment attempt.
18. Updates payment status.
19. Stores the idempotent response.
20. Creates an audit log.

---

## Payment Idempotency

The same `Idempotency-Key` must not be used for different requests.

If the same key is reused with a different request:

```http
409 Conflict
```

The system prevents duplicate financial processing.

If the same completed request is submitted again, PayFlow can return the previously stored response instead of processing the payment again.

---

## Get Payment

```http
GET /api/payments/:paymentId
```

Authentication:

```text
Required
```

The payment can be accessed by:

* The customer who owns the payment
* The merchant associated with the payment

Users cannot access unrelated payments.

---

# 11. Payment Attempts

## Get Payment Attempts

```http
GET /api/payment-attempts/:paymentId
```

Authentication:

```text
Required
```

Returns processing attempts associated with a payment.

Access is checked against the payment owner or associated merchant.

Attempts are returned in ascending attempt order.

---

# 12. Refund API

---

## Create Refund

```http
POST /api/refunds/:paymentId
```

Authentication:

```text
Required
```

### Example Request

```json
{
  "amount": 20,
  "reason": "Customer requested refund"
}
```

Refund validation includes:

* Amount must be positive.
* Payment must exist.
* Payment must be completed.
* Requested refund cannot exceed the remaining refundable amount.

A newly created refund has a pending status.

Refund references use:

```text
REF-
```

---

## Process Refund

```http
POST /api/refunds/:refundId/process
```

Authentication:

```text
Required
```

The refund processing flow:

1. Locks the refund.
2. Verifies refund status.
3. Verifies customer/merchant association.
4. Locks the customer wallet.
5. Locks the merchant account.
6. Checks account status.
7. Checks available merchant balance.
8. Debits the merchant account.
9. Credits the customer wallet.
10. Creates a refund transaction.
11. Creates a customer ledger entry.
12. Marks the refund completed.
13. Creates an audit log.

---

# 13. Merchant API

Merchant endpoints are restricted to the authenticated merchant.

---

## Merchant Dashboard

```http
GET /api/merchant-dashboard
```

Authentication:

```text
Required
```

Role:

```text
merchant
```

Returns merchant dashboard information.

---

## Merchant Payments

```http
GET /api/merchant/payments
```

Authentication:

```text
Required
```

Role:

```text
merchant
```

Returns payments associated with the authenticated merchant.

---

## Merchant Payment Details

```http
GET /api/merchant/payments/:paymentId
```

Authentication:

```text
Required
```

Role:

```text
merchant
```

Returns details of a merchant's payment.

---

## Merchant Refunds

```http
GET /api/merchant/refunds
```

Authentication:

```text
Required
```

Role:

```text
merchant
```

Returns merchant-related refunds.

---

## Merchant Refund Details

```http
GET /api/merchant/refunds/:refundId
```

Authentication:

```text
Required
```

Role:

```text
merchant
```

Returns details of a merchant-related refund.

---

## Merchant Transactions

```http
GET /api/merchant/transactions
```

Authentication:

```text
Required
```

Role:

```text
merchant
```

Returns merchant-related transactions.

---

## Merchant Activity

```http
GET /api/merchant/activity
```

Authentication:

```text
Required
```

Role:

```text
merchant
```

Returns merchant activity history.

---

# 14. Settlement API

Settlements move merchant funds from available balance into pending settlement balance and eventually complete or fail.

---

## Create Settlement

```http
POST /api/settlements
```

Authentication:

```text
Required
```

Role:

```text
merchant
```

The settlement operation:

1. Starts a database transaction.
2. Locks the merchant account.
3. Checks merchant account status.
4. Validates the amount.
5. Checks available balance.
6. Moves funds from available balance to pending balance.
7. Creates a pending settlement.

---

## Process Settlement

```http
POST /api/settlements/:settlementId/process
```

Authentication:

```text
Required
```

Role:

```text
merchant
```

Processes a pending settlement.

The settlement moves through processing and eventually becomes completed.

---

## Fail Settlement

```http
POST /api/settlements/:settlementId/fail
```

Authentication:

```text
Required
```

Role:

```text
merchant
```

Fails a pending settlement and returns the reserved amount from pending balance to available balance.

---

## List Settlements

```http
GET /api/settlements
```

Authentication:

```text
Required
```

Role:

```text
merchant
```

Returns settlements available to the authenticated merchant.

---

## Merchant Settlements

```http
GET /api/merchant/settlements
```

Authentication:

```text
Required
```

Role:

```text
merchant
```

Returns settlements belonging to the authenticated merchant.

---

## Merchant Settlement Details

```http
GET /api/merchant/settlements/:settlementId
```

Authentication:

```text
Required
```

Role:

```text
merchant
```

Returns details for a merchant settlement.

---

## Merchant Settlement Reconciliation

```http
GET /api/merchant/settlements/reconciliation
```

Authentication:

```text
Required
```

Role:

```text
merchant
```

Provides reconciliation information for merchant settlement balances.

The reconciliation compares:

* Total payment funds
* Total refunds
* Completed settlements
* Pending settlements
* Available balance
* Pending balance
* Expected available balance
* Expected pending balance
* Balance differences
* Overall reconciliation status

Example verified result:

```text
netMerchantFunds = 199
completedSettlements = 20
pendingSettlements = 5
availableBalance = 174
expectedAvailableBalance = 174
pendingBalance = 5
expectedPendingBalance = 5
availableDifference = 0
pendingDifference = 0
balanced = true
```

---

# 15. Reconciliation API

---

## Wallet Reconciliation

```http
GET /api/reconciliation/wallet
```

Authentication:

```text
Required
```

Checks wallet and ledger consistency.

---

## Merchant Reconciliation

```http
GET /api/reconciliation/merchant
```

Authentication:

```text
Required
```

Provides merchant financial reconciliation information.

---

## Payment Reconciliation

```http
GET /api/reconciliation/payments
```

Authentication:

```text
Required
```

Provides payment reconciliation information.

---

## Settlement Reconciliation

```http
GET /api/reconciliation/settlements
```

Authentication:

```text
Required
```

Role:

```text
merchant
```

Provides settlement reconciliation information.

---

# 16. Audit Logs

## Get Audit Logs

```http
GET /api/audit-logs
```

Authentication:

```text
Required
```

Returns audit records associated with the authenticated user.

Audit records can track important operations such as:

```text
PAYMENT_CREATED
PAYMENT_COMPLETED
REFUND_CREATED
REFUND_COMPLETED
WEBHOOK_PROCESSED
```

The endpoint limits returned records to a maximum of 100.

---

# 17. Webhooks

PayFlow supports webhook processing for payment status updates.

Webhook authentication does not use JWT.

Instead, PayFlow validates an HMAC-SHA256 signature.

---

## Receive Webhook

```http
POST /api/webhooks
```

Authentication:

```text
Webhook signature required
```

### Required Header

```http
Content-Type: application/json
x-webhook-signature: <HMAC_SHA256_SIGNATURE>
```

### Example Request

```json
{
  "provider": "payflow_wallet",
  "eventId": "evt-123456",
  "eventType": "payment.status_changed",
  "paymentId": "PAYMENT_ID",
  "status": "successful",
  "data": {
    "source": "payment-provider"
  }
}
```

---

## Webhook Fields

| Field       | Required | Description                      |
| ----------- | -------: | -------------------------------- |
| `provider`  |      Yes | Webhook provider                 |
| `eventId`   |      Yes | Unique provider event identifier |
| `eventType` |      Yes | Type of webhook event            |
| `paymentId` |       No | Related payment                  |
| `status`    |      Yes | Payment status                   |
| `data`      |       No | Additional webhook information   |

---

## Webhook Status Mapping

| Webhook Status | Payment Status |
| -------------- | -------------- |
| `successful`   | `completed`    |
| `failed`       | `failed`       |
| `cancelled`    | `cancelled`    |

---

## Webhook Signature Verification

PayFlow calculates an HMAC-SHA256 hash using:

```text
WEBHOOK_SECRET
```

and the raw request body.

The received signature is compared with the expected signature using a constant-time comparison.

Invalid signatures return:

```http
401 Unauthorized
```

```json
{
  "success": false,
  "message": "Invalid webhook signature"
}
```

---

## Missing Webhook Fields

If required fields are missing:

```http
400 Bad Request
```

```json
{
  "success": false,
  "message": "provider, eventId, eventType and status are required"
}
```

---

## Successful Webhook

A successfully processed webhook returns:

```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "webhook": {
    "status": "processed"
  }
}
```

---

## Duplicate Webhook Protection

Webhook events are uniquely identified by:

```text
provider + eventId
```

The database enforces uniqueness for this combination.

If the same webhook event is received again:

```http
200 OK
```

```json
{
  "success": true,
  "message": "Webhook already processed"
}
```

This prevents the same webhook from being processed multiple times.

---

## Payment Not Found

If a validly signed webhook references a payment that does not exist:

```http
404 Not Found
```

```json
{
  "success": false,
  "message": "Payment not found"
}
```

The webhook is retained in the database with:

```text
status = failed
error_message = Payment not found
```

This preserves the event for investigation and auditing.

---

## Webhook Database Statuses

The `webhooks.status` field supports:

```text
received
processing
processed
failed
```

---

# 18. HTTP Status Codes

| Status | Meaning                             |
| -----: | ------------------------------------ |
|  `200` | Successful request                  |
|  `201` | Resource successfully created       |
|  `400` | Invalid request                     |
|  `401` | Authentication or signature failure |
|  `403` | Insufficient permissions            |
|  `404` | Resource not found                  |
|  `409` | Request conflict                    |
|  `500` | Internal server error               |

---

# 19. Security Features

PayFlow implements multiple security controls.

## JWT Authentication

Protected API endpoints require valid JWT tokens.

## Role-Based Authorization

Role middleware restricts customer, merchant, and admin areas.

## Password Hashing

User passwords are hashed using bcrypt.

Passwords are not stored as plaintext.

## Authentication Rate Limiting

Login attempts are rate limited to reduce brute-force attacks.

## General API Rate Limiting

API requests are protected by a general rate limiter.

## Helmet

Helmet provides HTTP security headers.

## CORS

Express CORS middleware handles cross-origin request configuration.

## Webhook HMAC Verification

Webhook requests are authenticated using HMAC-SHA256.

## Constant-Time Signature Comparison

Webhook signatures are compared using:

```text
crypto.timingSafeEqual()
```

to reduce timing-based comparison attacks.

## Idempotency

Payment processing uses idempotency keys to prevent duplicate financial operations.

## Database Transactions

Financial operations use PostgreSQL transactions to ensure related changes are committed or rolled back together.

## Row-Level Locking

Critical financial records are locked during operations to reduce race conditions.

## Ledger

Financial wallet operations create ledger entries that can be used to verify wallet balances.

## Audit Logs

Important financial and security operations are recorded for traceability.

## Resource Authorization

Customer and merchant resources are scoped to the authenticated user or merchant.

---

# 20. Financial Operation Flows

## Deposit

```text
Customer
   ↓
Wallet
   ↓
Increase Balance
   ↓
Create Transaction
   ↓
Ledger Credit
   ↓
Audit Log
```

---

## Withdrawal

```text
Customer
   ↓
Wallet
   ↓
Check Balance
   ↓
Decrease Balance
   ↓
Create Transaction
   ↓
Ledger Debit
   ↓
Audit Log
```

---

## Wallet Transfer

```text
Sender Wallet
      ↓
   Debit
      ↓
Wallet Transfer
      ↓
 Receiver Wallet
      ↓
    Credit
      ↓
Ledger Entries
      ↓
Audit Logs
```

---

## Customer Payment

```text
Customer
   ↓
Customer Wallet
   ↓
Debit
   ↓
Payment
   ↓
Merchant Account
   ↓
Credit
```

---

## Refund

```text
Merchant Account
       ↓
     Debit
       ↓
     Refund
       ↓
Customer Wallet
       ↓
     Credit
```

---

## Settlement

```text
Merchant Available Balance
          ↓
      Settlement
          ↓
Merchant Pending Balance
          ↓
    Process Settlement
          ↓
       Completed
```

---

# 21. Database Architecture

PayFlow uses PostgreSQL.

Main tables:

| Table               | Purpose                     |
| ------------------- | ---------------------------- |
| `users`             | User accounts                |
| `wallets`           | Customer wallet balances     |
| `transactions`      | Financial transactions       |
| `ledger_entries`    | Financial ledger records     |
| `wallet_transfers`  | Wallet-to-wallet transfers    |
| `merchants`         | Merchant information          |
| `merchant_accounts` | Merchant balances             |
| `payments`          | Payment records                |
| `payment_methods`   | Payment methods                 |
| `payment_attempts`  | Payment processing attempts    |
| `refunds`           | Refund records                  |
| `settlements`       | Merchant settlement records      |
| `webhooks`          | Webhook events                   |
| `idempotency_keys`  | Idempotent request tracking      |
| `audit_logs`        | Audit and activity records       |

---

# 22. Important Database Relationships

### Payment

A payment is associated with:

```text
Customer
   ↓
Payment
   ↓
Merchant
```

### Wallet

A wallet belongs to a user:

```text
User
 ↓
Wallet
```

### Ledger

Ledger entries are associated with:

```text
Transaction
     ↓
Ledger Entry
     ↓
Wallet
```

### Webhook

A webhook can reference a payment:

```text
Webhook
   ↓
Payment
```

The payment relationship allows `NULL` when a referenced payment does not exist.

---

# 23. API Architecture

PayFlow follows a layered backend architecture:

```text
Client
   ↓
Express Routes
   ↓
Middleware
   ↓
Controllers
   ↓
Services
   ↓
PostgreSQL
```

### Routes

Routes define API endpoints and middleware requirements.

### Middleware

Middleware handles:

* Authentication
* Authorization
* Rate limiting
* Request processing
* Security

### Controllers

Controllers handle:

* Request validation
* Business-operation coordination
* Database operations
* HTTP responses

### Services

Services contain reusable business logic such as:

* Settlement processing
* Ledger operations
* Audit logging

### Database

PostgreSQL stores all persistent financial and user data.

---

# 24. Testing

PayFlow uses:

```text
Jest
Supertest
```

to test the API.

Run all tests:

```powershell
npm test -- --runInBand
```

Run a specific test file:

```powershell
npm test -- webhook.test.js --runInBand
```

---

# 25. Webhook Test Coverage

The webhook test suite currently verifies:

```text
✓ Invalid signature is rejected
✓ Missing signature is rejected
✓ Required fields are validated
✓ Successful payment webhook is processed
✓ Duplicate webhook is not processed twice
✓ Nonexistent payment is handled correctly
✓ Failed payment webhook is processed
✓ Cancelled payment webhook is processed
```

Current result:

```text
Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```

---

# 26. Reconciliation Testing

PayFlow also tests financial reconciliation.

A successful reconciliation verifies that:

```text
availableDifference = 0
pendingDifference = 0
balanced = true
```

Example:

```text
totalPayments: 224
totalRefunds: 25
netMerchantFunds: 199

completedSettlements: 20
pendingSettlements: 5

availableBalance: 174
expectedAvailableBalance: 174

pendingBalance: 5
expectedPendingBalance: 5

availableDifference: 0
pendingDifference: 0

balanced: true
```

---

# 27. Test Categories

The PayFlow backend contains automated tests covering areas including:

* Authentication
* Health check
* Wallet operations
* Payments
* Payment idempotency
* Refunds
* Reconciliation
* Security
* Customer resource authorization
* Webhooks

Examples of resource authorization tests verify that:

```text
Customer A cannot access Customer B's payment.
Customer A cannot access Customer B's refund.
Customer A cannot access Customer B's transaction.
```

---

# 28. Environment Configuration

The backend uses environment variables.

Example:

```env
PORT=5000
DATABASE_URL=<POSTGRES_CONNECTION_STRING>
JWT_SECRET=<JWT_SECRET>
WEBHOOK_SECRET=<WEBHOOK_SECRET>
```

Secrets must not be committed to Git.

The `.env` file should be included in `.gitignore`.

---

# 29. Running the Backend

Navigate to:

```powershell
cd C:\Users\hp\PayFlow\backend
```

Install dependencies:

```powershell
npm install
```

Start the backend:

```powershell
npm start
```

The server runs on:

```text
http://localhost:5000
```

The server verifies database connectivity before starting.

Expected terminal output:

```text
Database connected
Server running on port 5000
```

---

# 30. Project Structure

A simplified backend structure:

```text
backend/
│
├── src/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │
│   ├── middleware/
│   │
│   ├── routes/
│   │
│   ├── services/
│   │
│   ├── tests/
│   │
│   ├── app.js
│   └── server.js
│
├── .env
├── package.json
├── schema.sql
└── API_DOCUMENTATION.md
```

---

# 31. API Route Summary

## Authentication

| Method | Endpoint                  | Access        |
| ------ | -------------------------- | ------------- |
| POST   | `/api/auth/register`      | Public        |
| POST   | `/api/auth/login`         | Public        |
| GET    | `/api/auth/me`            | Authenticated |
| GET    | `/api/auth/customer-area` | Customer      |
| GET    | `/api/auth/merchant-area` | Merchant      |
| GET    | `/api/auth/admin-area`    | Admin         |

## Wallet

| Method | Endpoint                    | Access        |
| ------ | ---------------------------- | ------------- |
| GET    | `/api/wallet`               | Authenticated |
| POST   | `/api/wallet/deposit`       | Authenticated |
| POST   | `/api/wallet/withdraw`      | Authenticated |
| POST   | `/api/wallet/transfer`      | Authenticated |
| GET    | `/api/wallet/ledger`        | Authenticated |
| GET    | `/api/wallet/ledger/verify` | Authenticated |

## Customer

| Method | Endpoint                                    | Access   |
| ------ | -------------------------------------------- | -------- |
| GET    | `/api/customer-dashboard`                   | Customer |
| GET    | `/api/customer/payments`                    | Customer |
| GET    | `/api/customer/payments/:paymentId`         | Customer |
| GET    | `/api/customer/refunds`                     | Customer |
| GET    | `/api/customer/refunds/:refundId`           | Customer |
| GET    | `/api/customer/transactions`                | Customer |
| GET    | `/api/customer/transactions/:transactionId` | Customer |
| GET    | `/api/customer/transfers`                   | Customer |
| GET    | `/api/customer/activity`                    | Customer |

## Payments

| Method | Endpoint                           | Access        |
| ------ | ------------------------------------ | ------------- |
| POST   | `/api/payments`                    | Authenticated |
| POST   | `/api/payments/:paymentId/process` | Authenticated |
| GET    | `/api/payments/:paymentId`         | Authenticated |
| GET    | `/api/payment-attempts/:paymentId` | Authenticated |

## Refunds

| Method | Endpoint                         | Access        |
| ------ | ----------------------------------- | ------------- |
| POST   | `/api/refunds/:paymentId`        | Authenticated |
| POST   | `/api/refunds/:refundId/process` | Authenticated |

## Merchant

| Method | Endpoint                                   | Access   |
| ------ | -------------------------------------------- | -------- |
| GET    | `/api/merchant-dashboard`                  | Merchant |
| GET    | `/api/merchant/payments`                   | Merchant |
| GET    | `/api/merchant/payments/:paymentId`        | Merchant |
| GET    | `/api/merchant/refunds`                    | Merchant |
| GET    | `/api/merchant/refunds/:refundId`          | Merchant |
| GET    | `/api/merchant/transactions`               | Merchant |
| GET    | `/api/merchant/settlements`                | Merchant |
| GET    | `/api/merchant/settlements/:settlementId`  | Merchant |
| GET    | `/api/merchant/settlements/reconciliation` | Merchant |
| GET    | `/api/merchant/activity`                   | Merchant |

## Settlements

| Method | Endpoint                                 | Access   |
| ------ | ------------------------------------------- | -------- |
| POST   | `/api/settlements`                       | Merchant |
| POST   | `/api/settlements/:settlementId/process` | Merchant |
| POST   | `/api/settlements/:settlementId/fail`    | Merchant |
| GET    | `/api/settlements`                       | Merchant |

## Reconciliation

| Method | Endpoint                          | Access        |
| ------ | ------------------------------------ | ------------- |
| GET    | `/api/reconciliation/wallet`      | Authenticated |
| GET    | `/api/reconciliation/merchant`    | Authenticated |
| GET    | `/api/reconciliation/payments`    | Authenticated |
| GET    | `/api/reconciliation/settlements` | Merchant      |

## Audit and Webhooks

| Method | Endpoint          | Access            |
| ------ | ------------------ | ----------------- |
| GET    | `/api/audit-logs` | Authenticated     |
| POST   | `/api/webhooks`   | Webhook Signature |

---

# 32. Project Summary

PayFlow demonstrates a full-stack financial API architecture with:

* User authentication
* JWT authorization
* Role-based access control
* Digital wallets
* Deposits
* Withdrawals
* Wallet transfers
* Customer-to-merchant payments
* Payment attempts
* Idempotent payment processing
* Refund processing
* Merchant accounts
* Merchant settlements
* Financial reconciliation
* Double-entry-style ledger records
* Webhook signature verification
* Webhook duplicate protection
* Audit logging
* Rate limiting
* Database transactions
* Row-level locking
* Automated API testing

The system is designed around financial consistency, resource authorization, transaction safety, and traceability.