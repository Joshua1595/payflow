import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMerchantDashboard } from "../services/merchantDashboardService";

const MerchantDashboard = () => {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMerchantDashboard();

      if (data.success) {
        setDashboard(data);
      } else {
        setError(data.message || "Failed to load merchant dashboard.");
      }
    } catch (err) {
      console.error("Merchant dashboard error:", err);
      setError(
        err.response?.data?.message || "Failed to load merchant dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Circular progress helper
  const CircularStat = ({ value, total, label, color = "blue" }) => {
    const percentage = total > 0 ? Math.min((value / total) * 100, 100) : 0;
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    const colorMap = {
      blue: "text-blue-600 stroke-blue-600",
      green: "text-emerald-600 stroke-emerald-600",
      red: "text-red-500 stroke-red-500",
      amber: "text-amber-500 stroke-amber-500",
    };

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              className={colorMap[color]}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-bold ${colorMap[color].split(" ")[0]}`}>
              {value}
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm font-medium text-gray-600 text-center">
          {label}
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading merchant dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-start gap-3 bg-red-50 text-red-700 p-5 rounded-2xl border border-red-100">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const { merchant, account, payments, refunds, settlements } = dashboard;
  const currency = account.settlement_currency;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* ===== HEADER ===== */}
        <div className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-semibold tracking-wider text-blue-600 uppercase">
              Merchant Dashboard
            </p>
            <h1 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
              {merchant.business_name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 capitalize">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {merchant.status}
              </span>
              <span className="text-sm text-gray-500">
                Account · {account.account_number}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
          >
            ← Customer Dashboard
          </button>
        </div>

        {/* ===== BALANCE SECTION ===== */}
        <div className="mb-10 grid gap-6 lg:grid-cols-3">
          {/* Main Available Balance */}
          <div className="lg:col-span-2 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-8 text-white shadow-xl shadow-blue-600/25 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="relative">
              <p className="text-sm font-medium text-blue-100">Available Balance</p>
              <p className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">
                {Number(account.available_balance).toFixed(2)}
                <span className="ml-2 text-2xl font-medium text-blue-200">
                  {currency}
                </span>
              </p>
              <p className="mt-3 text-sm text-blue-100">
                Ready for settlement
              </p>
            </div>
          </div>

          {/* Pending Balance */}
          <div className="rounded-3xl bg-white border border-gray-100 p-8 shadow-sm flex flex-col justify-center">
            <p className="text-sm font-medium text-gray-500">Pending Balance</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
              {Number(account.pending_balance).toFixed(2)}
              <span className="ml-2 text-lg font-medium text-gray-400">
                {currency}
              </span>
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Currently pending
            </p>
          </div>
        </div>

        {/* ===== CIRCULAR STATS ===== */}
        <div className="mb-10 rounded-3xl bg-white border border-gray-100 p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-8">
            Performance Overview
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <CircularStat
              value={payments.successful}
              total={payments.total}
              label="Successful Payments"
              color="green"
            />
            <CircularStat
              value={payments.failed}
              total={payments.total}
              label="Failed Payments"
              color="red"
            />
            <CircularStat
              value={settlements.completed}
              total={settlements.total}
              label="Completed Settlements"
              color="blue"
            />
            <CircularStat
              value={settlements.pending}
              total={settlements.total}
              label="Pending Settlements"
              color="amber"
            />
          </div>
        </div>

        {/* ===== KEY NUMBERS ===== */}
        <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total Sales</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {Number(payments.total_sales).toFixed(2)}
              <span className="ml-1 text-sm font-medium text-gray-400">
                {currency}
              </span>
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total Payments</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {payments.total}
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total Refunded</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {Number(refunds.total_refunded).toFixed(2)}
              <span className="ml-1 text-sm font-medium text-gray-400">
                {currency}
              </span>
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total Settled</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {Number(settlements.total_settled).toFixed(2)}
              <span className="ml-1 text-sm font-medium text-gray-400">
                {currency}
              </span>
            </p>
          </div>
        </div>

        {/* ===== QUICK ACTIONS ===== */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            Quick Actions
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Payments",
                desc: "View all payments",
                path: "/merchant/payments",
                icon: "💳",
                bg: "bg-blue-50",
                text: "text-blue-600",
              },
              {
                title: "Refunds",
                desc: "Manage refunds",
                path: "/merchant/refunds",
                icon: "↩️",
                bg: "bg-rose-50",
                text: "text-rose-600",
              },
              {
                title: "Settlements",
                desc: "Settlement history",
                path: "/merchant/settlements",
                icon: "🏦",
                bg: "bg-emerald-50",
                text: "text-emerald-600",
              },
              {
                title: "Activity",
                desc: "Recent activity",
                path: "/merchant/activity",
                icon: "🕒",
                bg: "bg-violet-50",
                text: "text-violet-600",
              },
            ].map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => navigate(item.path)}
                className="group flex items-center gap-4 rounded-2xl bg-white border border-gray-100 p-5 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${item.bg} ${item.text} flex items-center justify-center text-xl flex-shrink-0`}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MerchantDashboard;