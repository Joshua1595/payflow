import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMerchantPaymentDetails } from "../services/merchantPaymentService";

function MerchantPaymentDetails() {
  const { paymentId } = useParams();
  const navigate = useNavigate();

  const [payment, setPayment] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [refunds, setRefunds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMerchantPaymentDetails(paymentId);

      setPayment(data.payment);
      setAttempts(data.attempts || []);
      setRefunds(data.refunds || []);
    } catch (error) {
      console.error("Merchant payment details error:", error);
      setError(
        error.response?.data?.message ||
          "Failed to load payment details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentDetails();
  }, [paymentId]);

  const formatAmount = (amount, currency) => {
    return `${Number(amount).toFixed(2)} ${currency}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusClass = (status) => {
    if (status === "completed" || status === "successful") {
      return "bg-emerald-50 text-emerald-700";
    }
    if (status === "failed") return "bg-red-50 text-red-700";
    if (status === "pending" || status === "processing") {
      return "bg-amber-50 text-amber-700";
    }
    return "bg-gray-100 text-gray-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <button
            onClick={() => navigate("/merchant/payments")}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
          >
            ← Back to payments
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
                onClick={() => navigate("/merchant/payments")}
                className="mt-4 inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Back to Payments
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 font-medium">Payment not found</p>
          <button
            onClick={() => navigate("/merchant/payments")}
            className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Back to payments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/merchant/payments")}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
          >
            ← Back to payments
          </button>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Payment Details
          </h1>
          <p className="mt-2 text-gray-500 font-mono text-sm">
            {payment.reference}
          </p>
        </div>

        {/* Payment Overview */}
        <div className="mb-6 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Payment Information
            </h2>
            <span
              className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-medium capitalize ${getStatusClass(
                payment.status
              )}`}
            >
              {payment.status}
            </span>
          </div>

          <div className="p-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Amount
              </p>
              <p className="text-xl font-bold text-gray-900">
                {formatAmount(payment.amount, payment.currency)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Reference
              </p>
              <p className="font-medium text-gray-900">
                {payment.reference}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Payment ID
              </p>
              <p className="font-mono text-sm text-gray-600 break-all">
                {payment.id}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Merchant
              </p>
              <p className="font-medium text-gray-900">
                {payment.merchant_name || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Created
              </p>
              <p className="text-sm text-gray-700">
                {formatDate(payment.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="mb-6 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Customer Information
            </h2>
          </div>

          <div className="p-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Customer Email
              </p>
              <p className="font-medium text-gray-900">
                {payment.customer_email || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Customer ID
              </p>
              <p className="font-mono text-sm text-gray-600 break-all">
                {payment.customer_id || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Attempts */}
        <div className="mb-6 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Payment Attempts
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Attempts made to process this payment
            </p>
          </div>

          {attempts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">No payment attempts found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead>
                  <tr className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-3.5">Attempt</th>
                    <th className="px-6 py-3.5">Provider</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Error</th>
                    <th className="px-6 py-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attempts.map((attempt) => (
                    <tr
                      key={attempt.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        #{attempt.attempt_number}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {attempt.provider}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {formatAmount(attempt.amount, attempt.currency)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusClass(
                            attempt.status
                          )}`}
                        >
                          {attempt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-red-600">
                        {attempt.error_message || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(attempt.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Refunds */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Refunds
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Refunds associated with this payment
            </p>
          </div>

          {refunds.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">
                No refunds associated with this payment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-3.5">Reference</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Reason</th>
                    <th className="px-6 py-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {refunds.map((refund) => (
                    <tr
                      key={refund.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {refund.reference}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {formatAmount(refund.amount, refund.currency)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusClass(
                            refund.status
                          )}`}
                        >
                          {refund.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {refund.reason || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(refund.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MerchantPaymentDetails;