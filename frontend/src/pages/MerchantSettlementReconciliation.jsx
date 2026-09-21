import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSettlementReconciliation } from "../services/merchantSettlementService";

function MerchantSettlementReconciliation() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReconciliation = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getSettlementReconciliation();
      setData(result);
    } catch (error) {
      console.error("Settlement reconciliation error:", error);
      setError(
        error.response?.data?.message ||
          "Failed to load settlement reconciliation."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliation();
  }, []);

  const formatAmount = (amount, currency) => {
    return `${Number(amount).toFixed(2)} ${currency}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">
            Running settlement reconciliation...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <button
            onClick={() => navigate("/merchant/settlements")}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
          >
            ← Back to settlements
          </button>

          <div className="flex items-start gap-3 bg-red-50 text-red-700 p-5 rounded-2xl border border-red-100">
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
            <div>
              <p>{error}</p>
              <button
                onClick={() => navigate("/merchant/settlements")}
                className="mt-4 inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Back to Settlements
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Settlement Reconciliation
            </h1>
            <p className="mt-2 text-gray-500">
              Compare merchant balances with settlement records.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchReconciliation}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
            >
              Run Again
            </button>
            <button
              onClick={() => navigate("/merchant/settlements")}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
            >
              ← Settlements
            </button>
          </div>
        </div>

        {/* Balance Status Banner */}
        <div
          className={`mb-8 rounded-2xl p-6 border ${
            data.balanced
              ? "bg-emerald-50 border-emerald-100"
              : "bg-red-50 border-red-100"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Reconciliation Status
              </p>
              <h2
                className={`mt-1 text-2xl font-bold ${
                  data.balanced ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {data.balanced ? "Balanced" : "Discrepancy Found"}
              </h2>
            </div>
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold ${
                data.balanced
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {data.balanced ? "✓" : "!"}
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="mb-6 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Account Information
            </h2>
          </div>
          <div className="p-6 grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Merchant ID
              </p>
              <p className="font-mono text-sm text-gray-600 break-all">
                {data.merchantId}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Merchant Account ID
              </p>
              <p className="font-mono text-sm text-gray-600 break-all">
                {data.merchantAccountId}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Currency
              </p>
              <p className="font-medium text-gray-900">{data.currency}</p>
            </div>
          </div>
        </div>

        {/* Payment & Refund Summary */}
        <div className="mb-6 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Payments
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
              {formatAmount(data.totalPayments, data.currency)}
            </p>
          </div>
          <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Refunds
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
              {formatAmount(data.totalRefunds, data.currency)}
            </p>
          </div>
          <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Net Merchant Funds
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-blue-600">
              {formatAmount(data.netMerchantFunds, data.currency)}
            </p>
          </div>
        </div>

        {/* Settlement Summary */}
        <div className="mb-6 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Settlement Summary
            </h2>
          </div>
          <div className="p-6 grid gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 p-5">
              <p className="text-sm text-gray-500">Completed Settlements</p>
              <p className="mt-2 text-xl font-bold text-gray-900">
                {formatAmount(data.completedSettlements, data.currency)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 p-5">
              <p className="text-sm text-gray-500">Pending Settlements</p>
              <p className="mt-2 text-xl font-bold text-gray-900">
                {formatAmount(data.pendingSettlements, data.currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Balance Reconciliation */}
        <div className="mb-6 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Balance Reconciliation
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Available Balance */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <p className="font-semibold text-gray-900">
                  Available Balance
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Actual balance vs expected balance
                </p>
              </div>
              <div className="md:text-right space-y-1">
                <p className="font-medium text-gray-900">
                  Actual: {formatAmount(data.availableBalance, data.currency)}
                </p>
                <p className="text-sm text-gray-500">
                  Expected:{" "}
                  {formatAmount(data.expectedAvailableBalance, data.currency)}
                </p>
                <p
                  className={`text-sm font-semibold ${
                    Math.abs(data.availableDifference) < 0.01
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  Difference:{" "}
                  {formatAmount(data.availableDifference, data.currency)}
                </p>
              </div>
            </div>

            {/* Pending Balance */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900">Pending Balance</p>
                <p className="mt-1 text-sm text-gray-500">
                  Actual balance vs expected pending settlements
                </p>
              </div>
              <div className="md:text-right space-y-1">
                <p className="font-medium text-gray-900">
                  Actual: {formatAmount(data.pendingBalance, data.currency)}
                </p>
                <p className="text-sm text-gray-500">
                  Expected:{" "}
                  {formatAmount(data.expectedPendingBalance, data.currency)}
                </p>
                <p
                  className={`text-sm font-semibold ${
                    Math.abs(data.pendingDifference) < 0.01
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  Difference:{" "}
                  {formatAmount(data.pendingDifference, data.currency)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Final Result */}
        <div
          className={`rounded-2xl p-6 border ${
            data.balanced
              ? "bg-emerald-50 border-emerald-100"
              : "bg-red-50 border-red-100"
          }`}
        >
          <h2
            className={`text-lg font-bold ${
              data.balanced ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {data.balanced
              ? "All settlement balances are reconciled."
              : "Settlement balances require investigation."}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            The reconciliation compares completed and pending settlements
            against the merchant account balances.
          </p>
        </div>
      </div>
    </div>
  );
}

export default MerchantSettlementReconciliation;