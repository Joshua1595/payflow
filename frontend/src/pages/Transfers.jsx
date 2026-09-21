import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCustomerTransfers,
  sendMoney,
  findReceiver,
} from "../services/customerTransferService";
import { getWallet } from "../services/walletService";

function Transfers() {
  const navigate = useNavigate();

  const [transfers, setTransfers] = useState([]);
  const [wallet, setWallet] = useState(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [receiverEmail, setReceiverEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [successTransfer, setSuccessTransfer] = useState(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [receiver, setReceiver] = useState(null);
  const [checkingReceiver, setCheckingReceiver] = useState(false);

  const [error, setError] = useState("");

  const loadTransfers = async () => {
    try {
      setLoading(true);
      setError("");

      const [transferData, walletData] = await Promise.all([
        getCustomerTransfers(page, limit),
        getWallet(),
      ]);

      if (transferData.success) {
        setTransfers(transferData.transfers || []);
        setTotalPages(transferData.totalPages || 1);
      }

      if (walletData.success) {
        setWallet(walletData.wallet);
      }
    } catch (err) {
      console.error("Failed to load transfer information:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load transfer information"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, [page]);

  const handleCheckReceiver = async () => {
    setError("");
    setReceiver(null);

    if (!receiverEmail.trim()) {
      setError("Receiver email is required");
      return;
    }

    try {
      setCheckingReceiver(true);
      const data = await findReceiver(receiverEmail.trim());

      if (data.success) {
        setReceiver(data.receiver);
      }
    } catch (err) {
      console.error("Receiver lookup error:", err);
      setError(err.response?.data?.message || "Receiver not found");
    } finally {
      setCheckingReceiver(false);
    }
  };

  const handleReviewTransfer = (e) => {
    e.preventDefault();
    setError("");

    if (!receiverEmail.trim()) {
      setError("Receiver email is required");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }

    if (!wallet) {
      setError("Wallet information is not available");
      return;
    }

    if (wallet.status !== "active") {
      setError("Your wallet is not active");
      return;
    }

    if (!receiver) {
      setError("Please verify the receiver before continuing");
      return;
    }

    if (Number(amount) > Number(wallet.balance)) {
      setError("Insufficient wallet balance");
      return;
    }

    setShowReview(true);
  };

  const handleConfirmTransfer = async () => {
    setError("");

    try {
      setSending(true);

      const data = await sendMoney(receiverEmail.trim(), Number(amount));

      if (data.success) {
        setSuccessTransfer({
          id: data.transfer.id,
          reference: data.transfer.reference,
          receiverEmail: receiverEmail.trim(),
          amount: data.transfer.amount,
          balance: data.senderWallet.balance,
          currency: data.senderWallet.currency,
        });

        setReceiverEmail("");
        setAmount("");
        setReceiver(null);
        setShowReview(false);

        await loadTransfers();
      }
    } catch (err) {
      console.error("Send money error:", err);
      setError(err.response?.data?.message || "Transfer failed");
      setShowReview(false);
    } finally {
      setSending(false);
    }
  };

  const handleCancelReview = () => {
    setShowReview(false);
    setError("");
  };

  const handleSendAnother = () => {
    setSuccessTransfer(null);
    setError("");
  };

  const balanceAfterTransfer = wallet
    ? Number(wallet.balance) - Number(amount || 0)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Transfers
          </h1>
          <p className="mt-2 text-gray-500">
            Send money to another PayFlow customer.
          </p>
        </div>

        {/* Wallet Balance */}
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg shadow-blue-600/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100">
                Available Wallet Balance
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight">
                {wallet
                  ? `${Number(wallet.balance).toFixed(2)} ${wallet.currency}`
                  : "—"}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium capitalize">
              <span
                className={`w-2 h-2 rounded-full ${
                  wallet?.status === "active" ? "bg-emerald-400" : "bg-gray-300"
                }`}
              />
              {wallet?.status || "active"}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 text-red-700 p-4 rounded-2xl border border-red-100 text-sm">
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

        {/* SUCCESS SCREEN */}
        {successTransfer && (
          <div className="mb-8 rounded-2xl bg-white border border-gray-100 shadow-sm p-8">
            <div className="mx-auto max-w-lg text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <svg
                  className="h-8 w-8 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h2 className="mt-5 text-2xl font-bold text-gray-900">
                Transfer Successful
              </h2>
              <p className="mt-2 text-gray-500">
                Your money has been successfully transferred.
              </p>

              <div className="mt-8 rounded-xl bg-slate-50 border border-gray-100 p-5 text-left space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Receiver</span>
                  <span className="font-medium text-gray-900">
                    {successTransfer.receiverEmail}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                  <span className="text-sm text-gray-500">Amount Sent</span>
                  <span className="font-bold text-gray-900">
                    {Number(successTransfer.amount).toFixed(2)}{" "}
                    {successTransfer.currency}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                  <span className="text-sm text-gray-500">Reference</span>
                  <span className="font-mono text-sm text-gray-700 break-all text-right max-w-[200px]">
                    {successTransfer.reference}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                  <span className="text-sm text-gray-500">Remaining Balance</span>
                  <span className="font-bold text-blue-600">
                    {Number(successTransfer.balance).toFixed(2)}{" "}
                    {successTransfer.currency}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/transfers/${successTransfer.id}`)
                  }
                  className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                >
                  View Transfer Details
                </button>
                <button
                  type="button"
                  onClick={handleSendAnother}
                  className="px-6 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all"
                >
                  Send Another Transfer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SEND MONEY FORM */}
        {!showReview && !successTransfer && (
          <div className="mb-8 rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">
              Send Money
            </h2>

            <form
              onSubmit={handleReviewTransfer}
              className="grid gap-5 md:grid-cols-3"
            >
              {/* Receiver */}
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Receiver Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={receiverEmail}
                    onChange={(e) => {
                      setReceiverEmail(e.target.value);
                      setReceiver(null);
                      setError("");
                    }}
                    placeholder="receiver@example.com"
                    className="min-w-0 flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={handleCheckReceiver}
                    disabled={checkingReceiver}
                    className="px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 text-sm font-medium text-blue-600 hover:bg-blue-100 disabled:opacity-50 transition-all whitespace-nowrap"
                  >
                    {checkingReceiver ? "Checking..." : "Check"}
                  </button>
                </div>

                {receiver && (
                  <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                    <p className="text-sm font-semibold text-emerald-700">
                      ✓ Receiver found
                    </p>
                    <p className="mt-1 text-sm text-gray-800 font-medium">
                      {receiver.name}
                    </p>
                    <p className="text-xs text-gray-500">{receiver.email}</p>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    ETB
                  </span>
                </div>
              </div>

              {/* Review Button */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                >
                  Review Transfer
                </button>
              </div>
            </form>
          </div>
        )}

        {/* REVIEW TRANSFER */}
        {showReview && (
          <div className="mb-8 rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Review Transfer
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Please verify the details before confirming.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 border border-gray-100 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Receiver</span>
                <span className="font-medium text-gray-900">
                  {receiver?.name || receiverEmail}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="text-sm text-gray-500">Transfer Amount</span>
                <span className="text-xl font-bold text-gray-900">
                  {Number(amount).toFixed(2)} ETB
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="text-sm text-gray-500">Current Balance</span>
                <span className="font-medium text-gray-900">
                  {Number(wallet.balance).toFixed(2)} ETB
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="text-sm font-medium text-gray-700">
                  Balance After Transfer
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {balanceAfterTransfer.toFixed(2)} ETB
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancelReview}
                disabled={sending}
                className="px-6 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTransfer}
                disabled={sending}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {sending ? (
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
                    Processing...
                  </>
                ) : (
                  "Confirm Send"
                )}
              </button>
            </div>
          </div>
        )}

        {/* TRANSFER HISTORY */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Transfer History
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                {transfers.length} transfers on this page
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Loading transfers...</p>
            </div>
          ) : transfers.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center text-2xl mb-4">
                🔄
              </div>
              <p className="text-gray-500 font-medium">No transfers found</p>
              <p className="mt-1 text-sm text-gray-400">
                Your transfer history will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <th className="px-6 py-3.5">Direction</th>
                      <th className="px-6 py-3.5">Reference</th>
                      <th className="px-6 py-3.5">Amount</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transfers.map((transfer) => (
                      <tr
                        key={transfer.id}
                        onClick={() =>
                          navigate(`/transfers/${transfer.id}`)
                        }
                        className="cursor-pointer hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                              transfer.direction === "sent"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {transfer.direction === "sent"
                              ? "Sent"
                              : "Received"}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-gray-600">
                          {transfer.reference}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {Number(transfer.amount).toFixed(2)}{" "}
                          <span className="text-sm font-medium text-gray-400">
                            ETB
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 capitalize">
                            {transfer.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(transfer.created_at).toLocaleString(
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-slate-50/30">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ← Previous
                  </button>

                  <p className="text-sm text-gray-500">
                    Page{" "}
                    <span className="font-medium text-gray-900">{page}</span> of{" "}
                    {totalPages}
                  </p>

                  <button
                    onClick={() =>
                      setPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={page === totalPages}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Transfers;