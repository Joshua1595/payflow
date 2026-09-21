import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCustomerTransferDetails } from "../services/customerTransferService";

function TransferDetails() {
  const { transferId } = useParams();
  const navigate = useNavigate();

  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTransfer = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getCustomerTransferDetails(transferId);
        setTransfer(data.transfer);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load transfer details"
        );
      } finally {
        setLoading(false);
      }
    };

    loadTransfer();
  }, [transferId]);

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
            Loading transfer details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <button
            onClick={() => navigate("/transfers")}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
          >
            ← Back to transfers
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
                onClick={() => navigate("/transfers")}
                className="mt-4 inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Back to Transfers
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!transfer) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/transfers")}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
          >
            ← Back to transfers
          </button>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Transfer Details
          </h1>
          <p className="mt-2 text-gray-500">
            Complete information about this transfer.
          </p>
        </div>

        {/* Status + Amount Card */}
        <div className="mb-6 rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Transfer Status</p>
              <span
                className={`mt-2 inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-medium capitalize ${getStatusClass(
                  transfer.status
                )}`}
              >
                {transfer.status}
              </span>
            </div>

            <div className="sm:text-right">
              <p className="text-sm text-gray-500">Amount</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
                {Number(transfer.amount).toFixed(2)}{" "}
                <span className="text-lg font-medium text-gray-400">
                  ETB
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Transfer Information */}
        <div className="mb-6 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Transfer Information
            </h2>
          </div>

          <div className="p-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Direction
              </p>
              <p className="font-medium capitalize text-gray-900">
                {transfer.direction}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Reference
              </p>
              <p className="font-mono text-sm text-gray-700 break-all">
                {transfer.reference}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Transfer ID
              </p>
              <p className="font-mono text-sm text-gray-600 break-all">
                {transfer.id}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Transaction ID
              </p>
              <p className="font-mono text-sm text-gray-600 break-all">
                {transfer.transaction_id || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Sender Wallet
              </p>
              <p className="font-mono text-sm text-gray-600 break-all">
                {transfer.sender_wallet_id || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Receiver Wallet
              </p>
              <p className="font-mono text-sm text-gray-600 break-all">
                {transfer.receiver_wallet_id || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Created At
              </p>
              <p className="text-sm text-gray-700">
                {new Date(transfer.created_at).toLocaleString(undefined, {
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

        {/* Sender */}
        <div className="mb-6 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Sender</h2>
          </div>

          <div className="p-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Name
              </p>
              <p className="font-medium text-gray-900">
                {transfer.sender?.name || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Email
              </p>
              <p className="text-gray-700">
                {transfer.sender?.email || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Receiver */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Receiver</h2>
          </div>

          <div className="p-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Name
              </p>
              <p className="font-medium text-gray-900">
                {transfer.receiver?.name || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Email
              </p>
              <p className="text-gray-700">
                {transfer.receiver?.email || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransferDetails;