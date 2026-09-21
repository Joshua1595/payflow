import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCustomerActivity } from "../services/customerActivityService";

const Activity = () => {
  const navigate = useNavigate();

  const [activities, setActivities] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadActivity = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getCustomerActivity(page, limit);

      if (data.success) {
        setActivities(data.activities || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        setError(data.message || "Failed to load activity.");
      }
    } catch (err) {
      console.error("Customer activity error:", err);
      setError(
        err.response?.data?.message || "Failed to load activity."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
  }, [page]);

  const getStatusClass = (status) => {
    if (status === "completed") return "bg-emerald-50 text-emerald-700";
    if (status === "pending") return "bg-amber-50 text-amber-700";
    if (status === "failed") return "bg-red-50 text-red-700";
    if (status === "cancelled") return "bg-gray-100 text-gray-600";
    return "bg-gray-100 text-gray-600";
  };

  const handleActivityClick = (activity) => {
    if (activity.entity_type === "payment") {
      navigate(`/payments/${activity.entity_id}`);
      return;
    }
    if (activity.entity_type === "refund") {
      navigate(`/refunds/${activity.entity_id}`);
      return;
    }
    if (activity.entity_type === "wallet_transfer") {
      navigate(`/transfers/${activity.entity_id}`);
      return;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Activity
            </h1>
            <p className="mt-2 text-gray-500">
              View your recent PayFlow activity.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
          >
            ← Dashboard
          </button>
        </div>

        {/* Summary */}
        <div className="mb-8 rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Activities
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            {total}
          </p>
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

        {/* Activity Table */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Loading activity...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center text-2xl mb-4">
                🕒
              </div>
              <p className="text-gray-500 font-medium">No activity found</p>
              <p className="mt-1 text-sm text-gray-400">
                Your recent activity will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-3.5">Type</th>
                    <th className="px-6 py-3.5">Reference</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activities.map((activity) => (
                    <tr
                      key={`${activity.entity_type}-${activity.entity_id}`}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {activity.activity_type}
                        </p>
                        <p className="mt-0.5 text-xs capitalize text-gray-500">
                          {activity.entity_type?.replace("_", " ")}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-500">
                          {activity.reference}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {Number(activity.amount).toFixed(2)}{" "}
                        <span className="text-sm font-medium text-gray-400">
                          {activity.currency}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusClass(
                            activity.status
                          )}`}
                        >
                          {activity.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(activity.created_at).toLocaleString(
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
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleActivityClick(activity)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
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
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Activity;