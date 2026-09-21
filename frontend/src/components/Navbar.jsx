import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isMerchant = user?.role === "merchant";
  const isCustomer = user?.role === "customer";

  const isPublicPage =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/register";

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `text-sm font-medium transition-colors ${
      isActive(path)
        ? "text-blue-600"
        : "text-gray-600 hover:text-blue-600"
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to={
            user
              ? isMerchant
                ? "/merchant-dashboard"
                : "/dashboard"
              : "/"
          }
          className="text-2xl font-bold tracking-tight text-blue-600 hover:text-blue-700 transition-colors"
        >
          PayFlow
        </Link>

        {/* Public Navbar */}
        {isPublicPage && !user && (
          <>
            {/* Center Links */}
            <div className="hidden md:flex items-center gap-8">
              <a
                href="/#features"
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                Features
              </a>
              <a
                href="/#how-it-works"
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                How It Works
              </a>
              <a
                href="/#security"
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                Security
              </a>
            </div>

            {/* Right Links */}
            <div className="flex items-center gap-3">
              {location.pathname === "/" && (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-sm shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/30 transition-all"
                  >
                    Get Started
                  </Link>
                </>
              )}

              {location.pathname === "/login" && (
                <>
                  <Link
                    to="/"
                    className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Home
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-sm shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/30 transition-all"
                  >
                    Get Started
                  </Link>
                </>
              )}

              {location.pathname === "/register" && (
                <>
                  <Link
                    to="/"
                    className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Home
                  </Link>
                  <Link
                    to="/login"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-sm shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/30 transition-all"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </>
        )}

        {/* Customer Navigation */}
        {isCustomer && (
          <div className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className={navLinkClass("/dashboard")}>
              Dashboard
            </Link>
            <Link to="/wallet" className={navLinkClass("/wallet")}>
              Wallet
            </Link>
            <Link to="/payments" className={navLinkClass("/payments")}>
              Payments
            </Link>
            <Link to="/transfers" className={navLinkClass("/transfers")}>
              Transfers
            </Link>
            <Link to="/transactions" className={navLinkClass("/transactions")}>
              Transactions
            </Link>
            <Link to="/refunds" className={navLinkClass("/refunds")}>
              Refunds
            </Link>
            <Link to="/activity" className={navLinkClass("/activity")}>
              Activity
            </Link>
          </div>
        )}

        {/* Merchant Navigation */}
        {isMerchant && (
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/merchant-dashboard"
              className={navLinkClass("/merchant-dashboard")}
            >
              Dashboard
            </Link>
            <Link
              to="/merchant/payments"
              className={navLinkClass("/merchant/payments")}
            >
              Payments
            </Link>
            <Link
              to="/merchant/refunds"
              className={navLinkClass("/merchant/refunds")}
            >
              Refunds
            </Link>
            <Link
              to="/merchant/settlements"
              className={navLinkClass("/merchant/settlements")}
            >
              Settlements
            </Link>
            <Link
              to="/merchant/activity"
              className={navLinkClass("/merchant/activity")}
            >
              Activity
            </Link>
          </div>
        )}

        {/* User / Logout */}
        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-gray-800 leading-tight">
                {user.name || user.email}
              </p>
              <p className="text-xs text-gray-500 capitalize mt-0.5">
                {user.role}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold border border-red-100 hover:bg-red-100 hover:border-red-200 transition-all"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;