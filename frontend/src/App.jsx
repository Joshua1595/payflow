import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";

import Dashboard from "./pages/Dashboard";
import Wallet from "./pages/Wallet";
import Payments from "./pages/Payments";
import Transactions from "./pages/Transactions";
import Transfers from "./pages/Transfers";
import TransactionDetails from "./pages/TransactionDetails";
import PaymentDetails from "./pages/PaymentDetails";
import MakePayment from "./pages/MakePayment";
import Refunds from "./pages/Refunds";
import RefundDetails from "./pages/RefundDetails";
import Activity from "./pages/Activity";
import TransferDetails from "./pages/TransferDetails";

import MerchantDashboard from "./pages/MerchantDashboard";
import MerchantPayments from "./pages/MerchantPayments";
import MerchantPaymentDetails from "./pages/MerchantPaymentDetails";
import MerchantRefunds from "./pages/MerchantRefunds";
import MerchantRefundDetails from "./pages/MerchantRefundDetails";
import MerchantSettlements from "./pages/MerchantSettlements";
import MerchantSettlementDetails from "./pages/MerchantSettlementDetails";
import MerchantSettlementReconciliation from "./pages/MerchantSettlementReconciliation";
import MerchantActivity from "./pages/MerchantActivity";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ================= MAIN LAYOUT ================= */}

          <Route element={<MainLayout />}>

            {/* ================= PUBLIC ROUTES ================= */}

            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ================= PROTECTED ROUTES ================= */}

            <Route
              element={
                <ProtectedRoute>
                  <Outlet />
                </ProtectedRoute>
              }
            >

              {/* ================= CUSTOMER ROUTES ================= */}

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute role="customer">
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/wallet"
                element={
                  <ProtectedRoute role="customer">
                    <Wallet />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/payments"
                element={
                  <ProtectedRoute role="customer">
                    <Payments />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/payments/new"
                element={
                  <ProtectedRoute role="customer">
                    <MakePayment />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/payments/:paymentId"
                element={
                  <ProtectedRoute role="customer">
                    <PaymentDetails />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/refunds"
                element={
                  <ProtectedRoute role="customer">
                    <Refunds />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/refunds/:refundId"
                element={
                  <ProtectedRoute role="customer">
                    <RefundDetails />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/transfers"
                element={
                  <ProtectedRoute role="customer">
                    <Transfers />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/transfers/:transferId"
                element={
                  <ProtectedRoute role="customer">
                    <TransferDetails />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/transactions"
                element={
                  <ProtectedRoute role="customer">
                    <Transactions />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/transactions/:transactionId"
                element={
                  <ProtectedRoute role="customer">
                    <TransactionDetails />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/activity"
                element={
                  <ProtectedRoute role="customer">
                    <Activity />
                  </ProtectedRoute>
                }
              />

              {/* ================= MERCHANT ROUTES ================= */}

              <Route
                path="/merchant-dashboard"
                element={
                  <ProtectedRoute role="merchant">
                    <MerchantDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/merchant/payments"
                element={
                  <ProtectedRoute role="merchant">
                    <MerchantPayments />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/merchant/payments/:paymentId"
                element={
                  <ProtectedRoute role="merchant">
                    <MerchantPaymentDetails />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/merchant/refunds"
                element={
                  <ProtectedRoute role="merchant">
                    <MerchantRefunds />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/merchant/refunds/:refundId"
                element={
                  <ProtectedRoute role="merchant">
                    <MerchantRefundDetails />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/merchant/settlements"
                element={
                  <ProtectedRoute role="merchant">
                    <MerchantSettlements />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/merchant/settlements/reconciliation"
                element={
                  <ProtectedRoute role="merchant">
                    <MerchantSettlementReconciliation />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/merchant/settlements/:settlementId"
                element={
                  <ProtectedRoute role="merchant">
                    <MerchantSettlementDetails />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/merchant/activity"
                element={
                  <ProtectedRoute role="merchant">
                    <MerchantActivity />
                  </ProtectedRoute>
                }
              />

            </Route>

          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;