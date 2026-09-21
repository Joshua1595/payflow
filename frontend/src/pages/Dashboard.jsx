import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getWallet } from "../services/walletService";
import { getCurrentUser } from "../services/userService";
import { getCustomerTransactions } from "../services/customerTransactionService";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionData, setTransactionData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [userData, walletData, transactionResponse] =
          await Promise.all([
            getCurrentUser(),
            getWallet(),
            getCustomerTransactions(),
          ]);

        setUser(userData?.user || null);
        setWallet(walletData?.wallet || null);
        setTransactionData(transactionResponse);
        setTransactions(transactionResponse?.transactions || []);
      } catch (error) {
        console.error("Dashboard error:", error);
        setError(
          error.response?.data?.message ||
            "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-red-50 text-red-700 px-6 py-4 rounded-2xl border border-red-100 max-w-md text-center">
          {error}
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
            Welcome back, {user?.name || "User"} 👋
          </h1>
          <p className="mt-2 text-gray-500">
            Here’s an overview of your PayFlow account.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Wallet Balance */}
          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Wallet Balance
              </p>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-lg">
                💰
              </div>
            </div>
            <h2 className="mt-4 text-3xl font-bold text-gray-900 tracking-tight">
              {Number(wallet?.balance || 0).toFixed(2)}
              <span className="ml-2 text-base font-medium text-gray-400">
                {wallet?.currency || "ETB"}
              </span>
            </h2>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                  wallet?.status === "active"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    wallet?.status === "active"
                      ? "bg-emerald-500"
                      : "bg-gray-400"
                  }`}
                />
                {wallet?.status || "active"}
              </span>
            </div>
          </div>

          {/* Total Transactions */}
          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Total Transactions
              </p>
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 text-lg">
                📊
              </div>
            </div>
            <h2 className="mt-4 text-3xl font-bold text-gray-900 tracking-tight">
              {transactionData?.total ?? 0}
            </h2>
            <p className="mt-3 text-sm text-gray-500">
              All wallet activity
            </p>
          </div>

          {/* Account Status */}
          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Account Status
              </p>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-lg">
                ✓
              </div>
            </div>
            <h2
              className={`mt-4 text-3xl font-bold tracking-tight ${
                user?.is_active ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {user?.is_active ? "Active" : "Inactive"}
            </h2>
            <p className="mt-3 text-sm text-gray-500">
              Customer account
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {[
              {
                title: "Wallet",
                desc: "Manage balance",
                path: "/wallet",
                icon: "💳",
                color: "bg-blue-50 text-blue-600",
              },
              {
                title: "Make Payment",
                desc: "Pay securely",
                path: "/payments",
                icon: "⚡",
                color: "bg-emerald-50 text-emerald-600",
              },
              {
                title: "Transfer",
                desc: "Send money",
                path: "/transfers",
                icon: "🔄",
                color: "bg-violet-50 text-violet-600",
              },
              {
                title: "Transactions",
                desc: "View history",
                path: "/transactions",
                icon: "📋",
                color: "bg-amber-50 text-amber-600",
              },
              {
                title: "Refunds",
                desc: "Refund history",
                path: "/refunds",
                icon: "↩️",
                color: "bg-rose-50 text-rose-600",
              },
              {
                title: "Activity",
                desc: "Recent activity",
                path: "/activity",
                icon: "🕒",
                color: "bg-sky-50 text-sky-600",
              },
            ].map((action) => (
              <button
                key={action.title}
                onClick={() => navigate(action.path)}
                className="group rounded-2xl bg-white border border-gray-100 p-5 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center text-lg mb-3`}
                >
                  {action.icon}
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {action.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {action.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="mt-10 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Transactions
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Your latest wallet activity
              </p>
            </div>
            <button
              onClick={() => navigate("/transactions")}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              View all →
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center text-2xl mb-4">
                📭
              </div>
              <p className="text-gray-500 font-medium">
                No transactions yet
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Your activity will appear here once you start using PayFlow.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
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
                  {transactions.slice(0, 5).map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="hover:bg-slate-50/50 transition-colors"
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
                        <span className="text-gray-400 font-medium text-sm">
                          {transaction.currency}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                            transaction.status === "completed"
                              ? "bg-emerald-50 text-emerald-700"
                              : transaction.status === "failed"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(
                          transaction.created_at
                        ).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Account Information */}
        <div className="mt-10 rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            Account Information
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Name
              </p>
              <p className="font-medium text-gray-900">
                {user?.name || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Email
              </p>
              <p className="font-medium text-gray-900">
                {user?.email || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Role
              </p>
              <p className="font-medium capitalize text-gray-900">
                {user?.role || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">
                Status
              </p>
              <p
                className={`font-medium ${
                  user?.is_active ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {user?.is_active ? "Active" : "Inactive"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;