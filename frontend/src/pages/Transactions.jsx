import { useEffect, useState } from "react";
import { getCustomerTransactions } from "../services/customerTransactionService";
import { useNavigate } from "react-router-dom";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getCustomerTransactions(page, limit);

      setTransactions(data.transactions || []);
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (error) {
      console.error("Transactions error:", error);
      setError(
        error.response?.data?.message || "Failed to load transactions"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [page]);

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
          <p className="text-gray-500 text-sm">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-10">
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Transaction History
          </h1>
          <p className="mt-2 text-gray-500">
            View all transactions associated with your PayFlow wallet.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Transactions
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              {pagination?.total ?? 0}
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Current Page
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              {pagination?.page ?? 1}
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Pages
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              {pagination?.totalPages ?? 0}
            </p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              All Transactions
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Showing {transactions.length} transactions on this page
            </p>
          </div>

          {transactions.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center text-2xl mb-4">
                📋
              </div>
              <p className="text-gray-500 font-medium">
                No transactions found
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Your transaction history will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <th className="px-6 py-3.5">Type</th>
                      <th className="px-6 py-3.5">Reference</th>
                      <th className="px-6 py-3.5">Amount</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        onClick={() =>
                          navigate(`/transactions/${transaction.id}`)
                        }
                        className="cursor-pointer hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="font-medium capitalize text-gray-900">
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-gray-500">
                            {transaction.reference}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {Number(transaction.amount).toFixed(2)}{" "}
                          <span className="text-sm font-medium text-gray-400">
                            {transaction.currency}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusClass(
                              transaction.status
                            )}`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(transaction.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-slate-50/30">
                  <button
                    onClick={() =>
                      setPage((currentPage) => Math.max(currentPage - 1, 1))
                    }
                    disabled={page === 1}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ← Previous
                  </button>

                  <p className="text-sm text-gray-500">
                    Page{" "}
                    <span className="font-medium text-gray-900">
                      {pagination.page}
                    </span>{" "}
                    of {pagination.totalPages}
                  </p>

                  <button
                    onClick={() =>
                      setPage((currentPage) =>
                        Math.min(currentPage + 1, pagination.totalPages)
                      )
                    }
                    disabled={page === pagination.totalPages}
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

export default Transactions;