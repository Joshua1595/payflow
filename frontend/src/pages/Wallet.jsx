import { useEffect, useState } from "react";
import {
  getWallet,
  depositMoney,
  withdrawMoney,
  getLedger,
  verifyLedger,
} from "../services/walletService";

function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [ledger, setLedger] = useState([]);

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [ledgerVerified, setLedgerVerified] = useState(null);
  const [showAllLedger, setShowAllLedger] = useState(false);

  const loadWallet = async () => {
    try {
      setLoading(true);
      setError("");

      const [walletData, ledgerData] = await Promise.all([
        getWallet(),
        getLedger(),
      ]);

      setWallet(walletData.wallet);
      setLedger(ledgerData.ledger || []);
    } catch (error) {
      console.error("Wallet loading error:", error);
      setError(
        error.response?.data?.message || "Failed to load wallet"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const handleDeposit = async (event) => {
    event.preventDefault();

    if (!depositAmount || Number(depositAmount) <= 0) {
      setError("Enter a valid deposit amount.");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setMessage("");

      const data = await depositMoney(Number(depositAmount));

      setMessage(data.message || "Deposit completed successfully.");
      setDepositAmount("");
      await loadWallet();
    } catch (error) {
      console.error("Deposit error:", error);
      setError(error.response?.data?.message || "Deposit failed.");
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async (event) => {
    event.preventDefault();

    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      setError("Enter a valid withdrawal amount.");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setMessage("");

      const data = await withdrawMoney(Number(withdrawAmount));

      setMessage(data.message || "Withdrawal completed successfully.");
      setWithdrawAmount("");
      await loadWallet();
    } catch (error) {
      console.error("Withdrawal error:", error);
      setError(error.response?.data?.message || "Withdrawal failed.");
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyLedger = async () => {
    try {
      setError("");
      setMessage("");

      const data = await verifyLedger();
      setLedgerVerified(data);

      if (data.verification?.isBalanced) {
        setMessage(
          data.verification.message || "Ledger verification passed."
        );
      } else {
        setError(
          data.verification?.message ||
            "Ledger verification found a difference."
        );
      }
    } catch (error) {
      console.error("Ledger verification error:", error);
      setError(
        error.response?.data?.message || "Ledger verification failed."
      );
    }
  };

  // Show only first 15 rows unless user expands
  const displayedLedger = showAllLedger ? ledger : ledger.slice(0, 15);
  const hasMore = ledger.length > 15;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            My Wallet
          </h1>
          <p className="mt-2 text-gray-500">
            Manage your balance, deposits, withdrawals, and ledger.
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 flex items-start gap-3 bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-100 text-sm">
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
            <span>{message}</span>
          </div>
        )}

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

        {/* Balance Card */}
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-lg shadow-blue-600/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100">
                Available Balance
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
                  {Number(wallet?.balance || 0).toFixed(2)}
                </h2>
                <span className="text-lg text-blue-200">
                  {wallet?.currency || "ETB"}
                </span>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 text-sm">
                <span
                  className={`w-2 h-2 rounded-full ${
                    wallet?.status === "active"
                      ? "bg-emerald-400"
                      : "bg-gray-300"
                  }`}
                />
                <span className="text-blue-100 capitalize">
                  {wallet?.status || "active"}
                </span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-3xl">
              💳
            </div>
          </div>
        </div>

        {/* Deposit / Withdraw */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Deposit */}
          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
                ⬇️
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Deposit Money
                </h2>
                <p className="text-sm text-gray-500">
                  Add funds to your wallet
                </p>
              </div>
            </div>

            <form onSubmit={handleDeposit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    {wallet?.currency || "ETB"}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
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
                    Processing...
                  </>
                ) : (
                  "Deposit"
                )}
              </button>
            </form>
          </div>

          {/* Withdraw */}
          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-lg">
                ⬆️
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Withdraw Money
                </h2>
                <p className="text-sm text-gray-500">
                  Withdraw funds from your wallet
                </p>
              </div>
            </div>

            <form onSubmit={handleWithdraw} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    {wallet?.currency || "ETB"}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-900 text-white font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
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
                    Processing...
                  </>
                ) : (
                  "Withdraw"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Ledger */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Wallet Ledger
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Showing {displayedLedger.length} of {ledger.length} entries
              </p>
            </div>

            <button
              onClick={handleVerifyLedger}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Verify Ledger
            </button>
          </div>

          {/* Ledger Verification Result */}
          {ledgerVerified && (
            <div className="px-6 py-4 border-b border-gray-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                    ledgerVerified.verification?.isBalanced
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      ledgerVerified.verification?.isBalanced
                        ? "bg-emerald-500"
                        : "bg-red-500"
                    }`}
                  />
                  {ledgerVerified.verification?.isBalanced
                    ? "Balanced"
                    : "Not Balanced"}
                </span>
                <span className="text-sm text-gray-500">
                  Ledger verification result
                </span>
              </div>
            </div>
          )}

          {ledger.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center text-2xl mb-4">
                📒
              </div>
              <p className="text-gray-500 font-medium">
                No ledger entries yet
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Deposits and withdrawals will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <th className="px-6 py-3.5">Entry</th>
                      <th className="px-6 py-3.5">Amount</th>
                      <th className="px-6 py-3.5">Description</th>
                      <th className="px-6 py-3.5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayedLedger.map((entry) => (
                      <tr
                        key={entry.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                              entry.entry_type === "credit"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {entry.entry_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {Number(entry.amount).toFixed(2)}{" "}
                          <span className="text-gray-400 font-medium text-sm">
                            {entry.currency}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {entry.description || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(entry.created_at).toLocaleString(
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

              {/* Show All / Show Less button */}
              {hasMore && (
                <div className="px-6 py-4 border-t border-gray-100 bg-slate-50/30 text-center">
                  <button
                    onClick={() => setShowAllLedger(!showAllLedger)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {showAllLedger ? (
                      <>
                        Show less
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
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </>
                    ) : (
                      <>
                        Show all {ledger.length} entries
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
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </>
                    )}
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

export default Wallet;