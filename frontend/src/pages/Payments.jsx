import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCustomerPayments } from "../services/paymentService";

function Payments() {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const limit = 10;

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getCustomerPayments(page, limit, status);

      setPayments(data.payments || []);
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (error) {
      console.error("Payments loading error:", error);
      setError(
        error.response?.data?.message || "Failed to load payments."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [page, status]);

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPage(1);
  };

  const getStatusStyle = (paymentStatus) => {
    switch (paymentStatus) {
      case "completed":
        return "bg-emerald-50 text-emerald-700";
      case "pending":
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
          <p className="text-gray-500 text-sm">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              My Payments
            </h1>
            <p className="mt-2 text-gray-500">
              View and manage your payment history.
            </p>
          </div>

          <button
            onClick={() => navigate("/payments/new")}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/30 transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Make Payment
          </button>
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

        {/* Summary Cards */}
        <div className="mb-8 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Payments
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900 tracking-tight">
              {pagination?.total ?? 0}
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Current Page
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900 tracking-tight">
              {pagination?.page ?? 1}
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Pages
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900 tracking-tight">
              {pagination?.totalPages ?? 0}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by status
          </label>
          <select
            value={status}
            onChange={handleStatusChange}
            className="w-full md:w-64 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          >
            <option value="">All Payments</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Payment Table */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Payment History
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Click any row to view payment details
            </p>
          </div>

          {payments.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center text-2xl mb-4">
                💳
              </div>
              <p className="text-gray-500 font-medium">
                No payments found
              </p>
              <p className="mt-1 text-sm text-gray-400">
                {status
                  ? "Try changing the status filter."
                  : "Make your first payment to get started."}
              </p>
              {!status && (
                <button
                  onClick={() => navigate("/payments/new")}
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Make Payment
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <th className="px-6 py-3.5">Reference</th>
                      <th className="px-6 py-3.5">Amount</th>
                      <th className="px-6 py-3.5">Currency</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        onClick={() =>
                          navigate(`/payments/${payment.id}`)
                        }
                        className="cursor-pointer hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {payment.reference}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400 font-mono">
                            {payment.id}
                          </p>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {Number(payment.amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {payment.currency}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusStyle(
                              payment.status
                            )}`}
                          >
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(payment.created_at).toLocaleString(
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
              {pagination && pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-slate-50/30">
                  <button
                    onClick={() =>
                      setPage((current) => Math.max(current - 1, 1))
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
                      setPage((current) =>
                        Math.min(current + 1, pagination.totalPages)
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

export default Payments;