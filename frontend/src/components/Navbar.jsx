import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  ChefHat,
  Calendar,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    isCustomer,
    isProvider,
    providerProfile,
    providerStage,
    logoutCustomer,
    logoutProvider,
  } = useAuth();

  const handleCustomerLogout = async () => {
    try {
      await logoutCustomer();
    } finally {
      navigate("/");
    }
  };

  const handleProviderLogout = async () => {
    try {
      await logoutProvider();
    } finally {
      navigate("/");
    }
  };

  const isHome =
    location.pathname === "/" && (!location.hash || location.hash === "#");
  const isSubscriptionNav =
    location.pathname === "/" && location.hash === "#subscription";
  const isCustomerPortal = location.pathname.startsWith("/customer");
  const isPartner = location.pathname.startsWith("/partner");
  const isLogin = location.pathname === "/login";

  const activeLinkClass =
    "text-sm font-bold text-blue-600 relative py-1 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600 after:rounded-full";
  const inactiveLinkClass =
    "text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors py-1";

  const providerTargetRoute =
    providerStage === "VERIFIED"
      ? "/provider/dashboard"
      : providerStage === "NEEDS_PROFILE"
        ? "/provider/onboarding"
        : "/provider/status";

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              {/* Tiffin Dabba Icon SVG */}
              <svg
                className="w-6 h-6 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 3h6M12 3v3" />
                <rect x="5" y="6" width="14" height="4" rx="2" />
                <rect x="5" y="11" width="14" height="4" rx="2" />
                <rect x="5" y="16" width="14" height="4" rx="2" />
                <path d="M4 8v10M20 8v10" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                Tiffin<span className="text-blue-600">Hub</span>
              </span>
              <span className="text-[11px] font-medium text-slate-400 tracking-wider">
                Good Food. Better Days.
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-10">
            <Link
              to="/"
              className={isHome ? activeLinkClass : inactiveLinkClass}
            >
              Home
            </Link>
            {isCustomer && user ? (
              <>
                <a
                  href="/#subscription"
                  className={isSubscriptionNav ? activeLinkClass : inactiveLinkClass}
                >
                  Explore Tiffins
                </a>
                <Link
                  to="/customer/dashboard?tab=subscriptions"
                  className={
                    isCustomerPortal
                      ? "text-sm font-bold text-blue-600 relative py-1 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600 after:rounded-full flex items-center gap-1.5"
                      : "text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors py-1 flex items-center gap-1.5"
                  }
                >
                  <Calendar
                    className={`w-3.5 h-3.5 ${
                      isCustomerPortal ? "text-blue-600" : "text-slate-500"
                    }`}
                  />
                  <span>My Subscriptions</span>
                </Link>
                <div className="flex items-center gap-3">
                  <Link
                    to="/customer/dashboard"
                    className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full border border-blue-100 transition-all cursor-pointer"
                    title="Go to Customer Dashboard"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                    <span>{user.name?.split(" ")[0] || "Customer"}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleCustomerLogout}
                    className="text-xs font-medium text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Log out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : isProvider && user ? (
              <>
                <a
                  href="/#subscription"
                  className={isSubscriptionNav ? activeLinkClass : inactiveLinkClass}
                >
                  Subscription
                </a>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                      <ChefHat className="w-3.5 h-3.5" />
                    </div>
                    <span className="max-w-[140px] truncate">
                      {providerProfile?.businessName ||
                        user.name?.split(" ")[0] ||
                        "Partner"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleProviderLogout}
                    className="text-xs font-medium text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Log out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <a
                  href="/#subscription"
                  className={isSubscriptionNav ? activeLinkClass : inactiveLinkClass}
                >
                  Subscription
                </a>
                <Link
                  to="/login"
                  className={`${isLogin ? activeLinkClass : inactiveLinkClass} cursor-pointer`}
                >
                  Login
                </Link>
              </>
            )}
          </nav>

          {/* Right Action: Become a Provider OR Provider Dashboard OR Customer Dashboard */}
          <div className="hidden md:flex items-center gap-4">
            {isCustomer && user ? (
              <Link
                to="/customer/dashboard?tab=overview"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-full shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : isProvider && user ? (
              <Link
                to={providerTargetRoute}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-6 py-2.5 rounded-full shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <ChefHat className="w-4 h-4" />
                <span>Provider Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/partner"
                className={`inline-flex items-center gap-2 text-white text-sm font-semibold px-6 py-2.5 rounded-full shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${
                  isPartner
                    ? "bg-blue-700 shadow-blue-700/30 ring-2 ring-blue-300"
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30"
                }`}
              >
                <span>Become a Provider</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/98 px-6 pt-4 pb-6 space-y-3 animate-fadeIn">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block text-base py-2 pl-3 ${
              isHome
                ? "font-bold text-blue-600 border-l-2 border-blue-600"
                : "font-medium text-slate-600 hover:text-blue-600"
            }`}
          >
            Home
          </Link>
          <a
            href="/#subscription"
            onClick={() => setMobileMenuOpen(false)}
            className={`block text-base py-2 pl-3 ${
              isSubscriptionNav
                ? "font-bold text-blue-600 border-l-2 border-blue-600"
                : "font-medium text-slate-600 hover:text-blue-600"
            }`}
          >
            Subscription
          </a>

          {isCustomer && user ? (
            <div className="py-2 pl-3 space-y-2 border-t border-slate-100">
              <Link
                to="/customer/dashboard?tab=subscriptions"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 text-sm py-1 ${
                  isCustomerPortal
                    ? "font-bold text-blue-600"
                    : "font-medium text-slate-600 hover:text-blue-600"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>My Subscriptions Portal</span>
              </Link>
              <div className="text-sm font-semibold text-slate-800">
                Logged in as <span className="text-blue-600">{user.name}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleCustomerLogout();
                }}
                className="text-sm font-medium text-red-500 hover:text-red-700 flex items-center gap-2 py-1 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : isProvider && user ? (
            <div className="py-2 pl-3 space-y-2 border-t border-slate-100">
              <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 text-emerald-600" />
                <span>{providerProfile?.businessName || user.name}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleProviderLogout();
                }}
                className="text-sm font-medium text-red-500 hover:text-red-700 flex items-center gap-2 py-1 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-base py-2 pl-3 ${
                isLogin
                  ? "font-bold text-blue-600 border-l-2 border-blue-600"
                  : "font-medium text-slate-600 hover:text-blue-600"
              }`}
            >
              Login
            </Link>
          )}

          <div className="pt-2">
            {isCustomer && user ? (
              <Link
                to="/customer/dashboard?tab=overview"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-full shadow-md shadow-blue-600/20 cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : isProvider && user ? (
              <Link
                to={providerTargetRoute}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-full shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <ChefHat className="w-4 h-4" />
                <span>Provider Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/partner"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-full shadow-md shadow-blue-600/20 cursor-pointer"
              >
                <span>Become a Provider</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
