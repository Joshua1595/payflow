import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMerchantSettlementDetails } from "../services/merchantSettlementService";

function MerchantSettlementDetails() {
  const { settlementId } = useParams();
  const navigate = useNavigate();

  const [settlement, setSettlement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMerchantSettlementDetails(settlementId);
      setSettlement(data.settlement);
    } catch (error) {
      console.error("Merchant settlement details error:", error);
      setError(
        error.response?.data?.message ||
          "Failed to load settlement details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [settlementId]);

  const formatAmount = (amount, currency) => {
    return `${Number(amount).toFixed(2)} ${currency}`;
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusClass = (status) => {
    if (status === "completed") return "bg-emerald-50 text-emerald-700";
    if (status === "failed") return "bg-red-50 text-red-700";
    if (status === "pending") return "bg-amber-50 text-amber-700";
    return "bg-gray-100 text-gray-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">
            Loading settlement details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 py-10">
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

  if (!settlement) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 font-medium">Settlement not found</p>
          <button
            onClick={() => navigate("/merchant/settlements")}
            className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Back to settlements
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/merchant/settlements")}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
          >
            ← Back to settlements
          </button>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Settlement Details
          </h1>
          <p className="mt-2 text-gray-500 font-mono text-sm">
            {settlement.reference}
          </p>
        </div>

        {/* Settlement Information */}
        <div className="mb-6 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Settlement Information
            </h2>
            <span
              className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-medium capitalize ${getStatusClass(
                settlement.status
              )}`}
            >
              {settlement.status}
            </span>
          </div>

          <div className="p-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Amount
              </p>
              <p className="text-xl font-bold text-gray-900">
                {formatAmount(settlement.amount, settlement.currency)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Reference
              </p>
              <p className="font-medium text-gray-900">
                {settlement.reference}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Settlement ID
              </p>
              <p className="font-mono text-sm text-gray-600 break-all">
                {settlement.id}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Created
              </p>
              <p className="text-sm text-gray-700">
                {formatDate(settlement.created_at)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Updated
              </p>
              <p className="text-sm text-gray-700">
                {formatDate(settlement.updated_at)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Completed
              </p>
              <p className="text-sm text-gray-700">
                {formatDate(settlement.completed_at)}
              </p>
            </div>

            {settlement.failure_reason && (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                  Failure Reason
                </p>
                <p className="text-sm font-medium text-red-600">
                  {settlement.failure_reason}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Merchant Information */}
        <div className="mb-6 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Merchant Information
            </h2>
          </div>

          <div className="p-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Business Name
              </p>
              <p className="font-medium text-gray-900">
                {settlement.merchant_name || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Merchant ID
              </p>
              <p className="font-mono text-sm text-gray-600 break-all">
                {settlement.merchant_id || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Merchant Account */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Merchant Account
            </h2>
          </div>

          <div className="p-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Account Number
              </p>
              <p className="font-medium text-gray-900">
                {settlement.account_number || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Merchant Account ID
              </p>
              <p className="font-mono text-sm text-gray-600 break-all">
                {settlement.merchant_account_id || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MerchantSettlementDetails;