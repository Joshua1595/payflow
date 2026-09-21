import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCustomerRefundDetails } from "../services/paymentService";

const RefundDetails = () => {
  const { refundId } = useParams();
  const navigate = useNavigate();

  const [refund, setRefund] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRefundDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getCustomerRefundDetails(refundId);

        if (data.success) {
          setRefund(data.refund);
        } else {
          setError(data.message || "Failed to load refund details.");
        }
      } catch (err) {
        console.error("Refund details error:", err);
        setError(
          err.response?.data?.message || "Failed to load refund details."
        );
      } finally {
        setLoading(false);
      }
    };

    if (refundId) {
      loadRefundDetails();
    }
  }, [refundId]);

  const getStatusClass = (status) => {
    if (status === "completed") return "bg-emerald-50 text-emerald-700";
    if (status === "pending") return "bg-amber-50 text-amber-700";
    if (status === "failed") return "bg-red-50 text-red-700";
    return "bg-gray-100 text-gray-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading refund details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <button
            type="button"
            onClick={() => navigate("/refunds")}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
          >
            ← Back to refunds
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
                type="button"
                onClick={() => navigate("/refunds")}
                className="mt-4 inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Back to Refunds
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!refund) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate("/refunds")}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
          >
            ← Back to refunds
          </button>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Refund Details
          </h1>
          <p className="mt-2 text-gray-500">
            Complete information about this refund.
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          {/* Reference + Status */}
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Refund Reference</p>
              <h2 className="mt-1 text-xl font-semibold text-gray-900">
                {refund.reference}
              </h2>
            </div>

            <span
              className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-medium capitalize ${getStatusClass(
                refund.status
              )}`}
            >
              {refund.status}
            </span>
          </div>

          {/* Amount */}
          <div className="px-6 py-6 border-b border-gray-100 bg-slate-50/50">
            <p className="text-sm text-gray-500">Refund Amount</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              {Number(refund.amount).toFixed(2)}{" "}
              <span className="text-lg font-medium text-gray-400">
                {refund.currency}
              </span>
            </p>
          </div>

          {/* Details Grid */}
          <div className="p-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Merchant
              </p>
              <p className="font-medium text-gray-900">
                {refund.merchant_name || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Reason
              </p>
              <p className="font-medium text-gray-900">
                {refund.reason || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Refund ID
              </p>
              <p className="font-mono text-sm text-gray-600 break-all">
                {refund.id}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Payment ID
              </p>
              <p className="font-mono text-sm text-gray-600 break-all">
                {refund.payment_id || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Merchant ID
              </p>
              <p className="font-mono text-sm text-gray-600 break-all">
                {refund.merchant_id || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Currency
              </p>
              <p className="font-medium text-gray-900">
                {refund.currency}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Created At
              </p>
              <p className="text-sm text-gray-700">
                {new Date(refund.created_at).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Updated At
              </p>
              <p className="text-sm text-gray-700">
                {new Date(refund.updated_at).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Related Payment */}
          <div className="px-6 py-5 border-t border-gray-100 bg-slate-50/30">
            <h3 className="text-sm font-semibold text-gray-900">
              Related Payment
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              This refund is linked to a payment.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/payments/${refund.payment_id}`)}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
            >
              View Payment
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundDetails;