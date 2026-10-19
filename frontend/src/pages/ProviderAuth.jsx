import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  ChefHat,
  ArrowRight,
  ShieldCheck,
  Utensils,
  Sparkles,
  Lock,
  Mail,
  User,
  Phone,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function ProviderAuth({ initialMode = "register" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginProvider, registerProvider } = useAuth();

  // Mode can be 'register' or 'login'
  const [mode, setMode] = useState(
    location.pathname === "/provider/login" || initialMode === "login"
      ? "login"
      : "register",
  );

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setError("");
    setSuccessMessage("");
    window.history.pushState(
      null,
      "",
      newMode === "login" ? "/provider/login" : "/provider/register",
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      if (mode === "register") {
        // Validation
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Password and confirm password do not match");
        }

        if (formData.password.length < 6) {
          throw new Error("Password must be at least 6 characters long");
        }

        // Call registerProvider (POST /api/provider/register)
        // Automatically creates user with role 'PROVIDER' and sets 'providerToken' HTTP-only cookie
        const res = await registerProvider({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        });

        setSuccessMessage(
          "Partner account created! Session established. Redirecting to onboarding wizard...",
        );

        // Immediate redirection to Step 2: Onboarding Wizard as per business flow
        setTimeout(() => {
          navigate("/provider/onboarding");
        }, 600);
      } else {
        // Provider Login (POST /api/provider/login)
        const res = await loginProvider(formData.email, formData.password);
        const stage = res.data?.stage;

        setSuccessMessage("Logged in successfully! Redirecting...");

        setTimeout(() => {
          // If profile is incomplete, go to Step 2 Onboarding Wizard
          // If profile is verified and acknowledged, go directly to kitchen dashboard
          // Otherwise (APPROVED_MILESTONE, PENDING_APPROVAL, REJECTED), go to status page
          if (stage === "NEEDS_PROFILE") {
            navigate("/provider/onboarding");
          } else if (stage === "VERIFIED") {
            navigate("/provider/dashboard");
          } else {
            navigate("/provider/status");
          }
        }, 600);
      }
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong. Please check your credentials and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden font-sans antialiased">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top back navigation */}
      <div className="absolute top-6 left-6 sm:left-12 z-20">
        <Link
          to="/partner"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Partner Portal</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10 px-4 sm:px-0">
        {/* Step Progress Pill for Registration */}
        {mode === "register" && (
          <div className="mb-4 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/70 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Step 1 of 2: Create Provider Account</span>
            </div>
          </div>
        )}

        {/* Auth Card */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl shadow-slate-200/60 rounded-3xl border border-slate-100">
          {/* Header Icon & Brand */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 block">
                  TiffinHub Partner
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Kitchen & Provider Portal
                </span>
              </div>
            </div>

            {/* Quick Mode Switch Pills */}
            {/* <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleModeSwitch("register")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  mode === "register"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Join Now
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch("login")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  mode === "login"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Sign In
              </button>
            </div> */}
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
            {mode === "register" ? "Register as a Provider" : "Partner Sign In"}
          </h2>

          {/* Subtitle */}
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            {mode === "register"
              ? "Set up your provider credentials."
              : "Sign in to access your provider onboarding status and kitchen dashboard."}
          </p>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">
                {successMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1 Registration Fields */}
            {mode === "register" && (
              <>
                {/* Owner's Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Owner's Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Ramesh Patel"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. kitchen@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={
                    mode === "register"
                      ? "Min. 6 characters"
                      : "Enter your password"
                  }
                  className="w-full pl-10 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (Register only) */}
            {mode === "register" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat your password"
                    className="w-full pl-10 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Micro-callout for automatic cookie & session */}
            {/* {mode === "register" && (
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 flex items-start gap-2.5 text-xs text-emerald-800">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Immediate Access:</strong> Submitting will create your
                  provider account and establish an authenticated session
                  directly so you can proceed to the kitchen onboarding wizard.
                </span>
              </div>
            )} */}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {mode === "register"
                        ? "Creating account..."
                        : "Signing in..."}
                    </span>
                  </>
                ) : mode === "register" ? (
                  <>
                    <span>Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Sign In to Partner Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Bottom Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-sm text-slate-500">
            {mode === "register" ? (
              <p>
                Already have a partner account?{" "}
                <button
                  type="button"
                  onClick={() => handleModeSwitch("login")}
                  className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                Want to become a partner?{" "}
                <button
                  type="button"
                  onClick={() => handleModeSwitch("register")}
                  className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  Register Now
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Security & Support Note */}
        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Encrypted connection with secure HTTP-only session tokens</span>
        </div>
      </div>
    </div>
  );
}
