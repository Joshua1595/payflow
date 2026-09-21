import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCustomerPaymentDetails } from "../services/paymentService";

function PaymentDetails() {
  const { paymentId } = useParams();
  const navigate = useNavigate();

  const [payment, setPayment] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [transaction, setTransaction] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPaymentDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getCustomerPaymentDetails(paymentId);

      setPayment(data.payment);
      setAttempts(data.attempts || []);
      setRefunds(data.refunds || []);
      setTransaction(data.transaction || null);
    } catch (error) {
      console.error("Payment details error:", error);
      setError(
        error.response?.data?.message ||
          "Failed to load payment details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentDetails();
  }, [paymentId]);

  const getStatusStyle = (status) => {
    switch (status) {
      case "successful":
      case "completed":
        return "bg-emerald-50 text-emerald-700";
      case "pending":
      case "processing":
        return "bg-amber-50 text-amber-700";
      case "failed":
        return "bg-red-50 text-red-700";
      case "cancelled":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-blue-50 text-blue-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">
            Loading payment details...
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
            onClick={() => navigate("/payments")}
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
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!payment) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/payments")}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
          >
            ← Back to payments
          </button>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Payment Details
          </h1>
          <p className="mt-2 text-gray-500">
            Complete information about this payment.
          </p>
        </div>

        {/* Payment Summary */}
        <div className="mb-6 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Payment Reference</p>
              <h2 className="mt-1 text-xl font-semibold text-gray-900">
                {payment.reference}
              </h2>
            </div>

            <span
              className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-medium capitalize ${getStatusStyle(
                payment.status
              )}`}
            >
              {payment.status}
            </span>
          </div>

          <div className="p-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Amount
              </p>
              <p className="text-xl font-semibold text-gray-900">
                {Number(payment.amount).toFixed(2)}{" "}
                <span className="text-base font-medium text-gray-400">
                  {payment.currency}
                </span>
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
                Payment ID
              </p>
              <p className="text-sm font-mono text-gray-600 break-all">
                {payment.id}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Created
              </p>
              <p className="text-sm text-gray-700">
                {new Date(payment.created_at).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
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
                        {Number(attempt.amount).toFixed(2)}{" "}
                        <span className="text-sm font-medium text-gray-400">
                          {attempt.currency}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusStyle(
                            attempt.status
                          )}`}
                        >
                          {attempt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(attempt.created_at).toLocaleString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Related Transaction */}
        <div className="mb-6 rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            Related Transaction
          </h2>

          {transaction ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                  Type
                </p>
                <p className="font-medium capitalize text-gray-900">
                  {transaction.type}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                  Amount
                </p>
                <p className="font-semibold text-gray-900">
                  {Number(transaction.amount).toFixed(2)}{" "}
                  <span className="text-sm font-medium text-gray-400">
                    {transaction.currency}
                  </span>
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                  Status
                </p>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusStyle(
                    transaction.status
                  )}`}
                >
                  {transaction.status}
                </span>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                  Reference
                </p>
                <p className="text-sm font-mono text-gray-600">
                  {transaction.reference}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No related transaction found.</p>
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
              <p className="text-gray-500">No refunds found.</p>
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
                        {Number(refund.amount).toFixed(2)}{" "}
                        <span className="text-sm font-medium text-gray-400">
                          {refund.currency}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusStyle(
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
                        {new Date(refund.created_at).toLocaleString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
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

export default PaymentDetails;