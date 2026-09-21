import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMerchantActivity } from "../services/merchantActivityService";

function MerchantActivity() {
  const navigate = useNavigate();

  const [activities, setActivities] = useState([]);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchActivity = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMerchantActivity(limit);
      setActivities(data.activities || []);
    } catch (error) {
      console.error("Merchant activity error:", error);
      setError(
        error.response?.data?.message ||
          "Failed to load merchant activity."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [limit]);

  const formatAmount = (amount, currency) => {
    return `${Number(amount).toFixed(2)} ${currency}`;
  };

  const formatDate = (date) => {
    if (!date) return "—";
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
    if (status === "pending") return "bg-amber-50 text-amber-700";
    if (status === "processing") return "bg-blue-50 text-blue-700";
    if (status === "cancelled") return "bg-gray-100 text-gray-600";
    return "bg-gray-100 text-gray-600";
  };

  const getActivityClass = (activityType) => {
    if (activityType === "PAYMENT") return "bg-blue-50 text-blue-700";
    if (activityType === "REFUND") return "bg-orange-50 text-orange-700";
    if (activityType === "SETTLEMENT") return "bg-violet-50 text-violet-700";
    return "bg-gray-100 text-gray-600";
  };

  const getActivityLabel = (activityType) => {
    if (activityType === "PAYMENT") return "Payment received";
    if (activityType === "REFUND") return "Refund processed";
    if (activityType === "SETTLEMENT") return "Settlement";
    return activityType;
  };

  const handleActivityClick = (activity) => {
    if (activity.entity_type === "payment") {
      navigate(`/merchant/payments/${activity.entity_id}`);
      return;
    }
    if (activity.entity_type === "refund") {
      navigate(`/merchant/refunds/${activity.entity_id}`);
      return;
    }
    if (activity.entity_type === "settlement") {
      navigate(`/merchant/settlements/${activity.entity_id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading merchant activity...</p>
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
              Merchant Activity
            </h1>
            <p className="mt-2 text-gray-500">
              Recent payments, refunds, and settlements.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchActivity}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
            >
              Refresh
            </button>
            <button
              onClick={() => navigate("/merchant-dashboard")}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
            >
              ← Dashboard
            </button>
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

        {/* Summary */}
        <div className="mb-8 rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Recent Activities
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            {activities.length}
          </p>
        </div>

        {/* Activity List */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          {activities.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center text-2xl mb-4">
                🕒
              </div>
              <p className="text-gray-500 font-medium">
                No merchant activity found
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Recent payments, refunds, and settlements will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {activities.map((activity) => (
                <div
                  key={`${activity.entity_type}-${activity.entity_id}`}
                  onClick={() => handleActivityClick(activity)}
                  className="p-5 hover:bg-slate-50/70 cursor-pointer transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left */}
                    <div className="flex items-start gap-4">
                      <div
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide ${getActivityClass(
                          activity.activity_type
                        )}`}
                      >
                        {activity.activity_type}
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900">
                          {getActivityLabel(activity.activity_type)}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Reference:{" "}
                          <span className="font-medium text-gray-700">
                            {activity.reference || "—"}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {formatDate(activity.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-5">
                      <div className="text-left lg:text-right">
                        <p className="font-bold text-gray-900">
                          {formatAmount(activity.amount, activity.currency)}
                        </p>
                        <span
                          className={`inline-flex items-center mt-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusClass(
                            activity.status
                          )}`}
                        >
                          {activity.status}
                        </span>
                      </div>
                      <span className="text-gray-300 text-lg">→</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Limit selector */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            Showing the latest {activities.length} activities
          </p>

          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          >
            <option value={10}>10 activities</option>
            <option value={20}>20 activities</option>
            <option value={50}>50 activities</option>
            <option value={100}>100 activities</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default MerchantActivity;