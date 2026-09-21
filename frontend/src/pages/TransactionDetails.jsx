import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCustomerTransactionDetails } from "../services/customerTransactionService";

function TransactionDetails() {
  const { transactionId } = useParams();
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTransaction = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getCustomerTransactionDetails(transactionId);
        setTransaction(data.transaction);
      } catch (error) {
        console.error("Transaction details error:", error);
        setError(
          error.response?.data?.message ||
            "Failed to load transaction details"
        );
      } finally {
        setLoading(false);
      }
    };

    loadTransaction();
  }, [transactionId]);

  const getStatusClass = (status) => {
    if (status === "completed") return "bg-emerald-50 text-emerald-700";
    if (status === "failed") return "bg-red-50 text-red-700";
    if (status === "cancelled") return "bg-gray-100 text-gray-600";
    return "bg-amber-50 text-amber-700";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading transaction...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <button
            onClick={() => navigate("/transactions")}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
          >
            ← Back to transactions
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

  if (!transaction) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 font-medium">Transaction not found</p>
          <button
            onClick={() => navigate("/transactions")}
            className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Back to transactions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/transactions")}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
          >
            ← Back to transactions
          </button>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Transaction Details
          </h1>
          <p className="mt-2 text-gray-500">
            Detailed information about this transaction.
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          {/* Type + Status */}
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Transaction Type</p>
              <h2 className="mt-1 text-2xl font-bold capitalize text-gray-900">
                {transaction.type}
              </h2>
            </div>

            <span
              className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-medium capitalize ${getStatusClass(
                transaction.status
              )}`}
            >
              {transaction.status}
            </span>
          </div>

          {/* Amount */}
          <div className="px-6 py-6 border-b border-gray-100">
            <p className="text-sm text-gray-500">Amount</p>
            <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900">
              {Number(transaction.amount).toFixed(2)}
              <span className="ml-2 text-xl font-medium text-gray-400">
                {transaction.currency}
              </span>
            </p>
          </div>

          {/* Details Grid */}
          <div className="p-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Transaction ID
              </p>
              <p className="font-mono text-sm text-gray-700 break-all">
                {transaction.id}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Reference
              </p>
              <p className="font-mono text-sm text-gray-700 break-all">
                {transaction.reference}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Wallet ID
              </p>
              <p className="font-mono text-sm text-gray-700 break-all">
                {transaction.wallet_id || "—"}
              </p>
            </div>

            {transaction.payment_id && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                  Payment ID
                </p>
                <p className="font-mono text-sm text-gray-700 break-all">
                  {transaction.payment_id}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Status
              </p>
              <p className="font-medium capitalize text-gray-900">
                {transaction.status}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Currency
              </p>
              <p className="font-medium text-gray-900">
                {transaction.currency}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Created At
              </p>
              <p className="text-sm text-gray-700">
                {new Date(transaction.created_at).toLocaleString(undefined, {
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
      </div>
    </div>
  );
}

export default TransactionDetails;