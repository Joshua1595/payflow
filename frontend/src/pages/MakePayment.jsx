import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getActiveMerchants,
  createPayment,
  processPayment,
} from "../services/paymentService";

const MakePayment = () => {
  const navigate = useNavigate();

  const [merchants, setMerchants] = useState([]);
  const [merchantId, setMerchantId] = useState("");
  const [amount, setAmount] = useState("");

  const [loadingMerchants, setLoadingMerchants] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadMerchants = async () => {
      try {
        setLoadingMerchants(true);
        setError("");

        const data = await getActiveMerchants();

        if (data.success) {
          setMerchants(data.merchants || []);
        } else {
          setError(data.message || "Failed to load merchants");
        }
      } catch (err) {
        console.error("Load merchants error:", err);
        setError(
          err.response?.data?.message || "Failed to load merchants"
        );
      } finally {
        setLoadingMerchants(false);
      }
    };

    loadMerchants();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!merchantId) {
      setError("Please select a merchant.");
      return;
    }

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    try {
      setProcessing(true);

      // Step 1: Create payment
      const createData = await createPayment({
        merchantId,
        amount: numericAmount,
        currency: "ETB",
      });

      if (!createData.success || !createData.payment) {
        setError(createData.message || "Failed to create payment.");
        return;
      }

      const paymentId = createData.payment.id;

      // Step 2: Generate a unique idempotency key
      const idempotencyKey = crypto.randomUUID();

      // Step 3: Process payment
      const processData = await processPayment(paymentId, idempotencyKey);

      if (!processData.success) {
        setError(processData.message || "Payment processing failed.");
        return;
      }

      setSuccess("Payment completed successfully.");

      // Step 4: Go to payment details
      setTimeout(() => {
        navigate(`/payments/${paymentId}`);
      }, 800);
    } catch (err) {
      console.error("Payment error:", err);
      setError(
        err.response?.data?.message ||
          "Payment failed. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/payments")}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
          >
            ← Back to payments
          </button>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Make Payment
          </h1>
          <p className="mt-2 text-gray-500">
            Select a merchant and enter the amount you want to pay.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 sm:p-8">
          {/* Messages */}
          {error && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-start gap-3 bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 text-sm">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Merchant */}
            <div>
              <label
                htmlFor="merchant"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Merchant
              </label>
              <select
                id="merchant"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                disabled={loadingMerchants || processing}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">
                  {loadingMerchants
                    ? "Loading merchants..."
                    : "Select a merchant"}
                </option>
                {merchants.map((merchant) => (
                  <option key={merchant.id} value={merchant.id}>
                    {merchant.business_name}
                  </option>
                ))}
              </select>
              {!loadingMerchants && merchants.length === 0 && (
                <p className="mt-2 text-sm text-amber-600">
                  No active merchants available at the moment.
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                  ETB
                </span>
                <input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={processing}
                  placeholder="0.00"
                  className="w-full pl-14 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={
                processing || loadingMerchants || merchants.length === 0
              }
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
            >
              {processing ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing Payment...
                </>
              ) : (
                "Pay Now"
              )}
            </button>
          </form>

          {/* Cancel */}
          <button
            type="button"
            onClick={() => navigate("/payments")}
            disabled={processing}
            className="mt-4 w-full py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MakePayment;