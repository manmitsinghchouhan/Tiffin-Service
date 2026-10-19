import React from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import {
  ChefHat,
  ShieldCheck,
  UtensilsCrossed,
  Calendar,
  ShoppingBag,
  TrendingUp,
  LogOut,
  MapPin,
  Building2,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  Phone,
  Mail,
  Utensils,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const { user, providerProfile, providerStage, loading, logoutProvider } = useAuth();

  // Route Guard Checks
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-400">Loading Kitchen Dashboard...</span>
        </div>
      </div>
    );
  }

  // If not logged in as Provider, redirect to provider login
  if (!user || user.role !== 'PROVIDER') {
    return <Navigate to="/provider/login" replace />;
  }

  // If haven't completed Step 2 onboarding, redirect to wizard
  if (providerStage === 'NEEDS_PROFILE') {
    return <Navigate to="/provider/onboarding" replace />;
  }

  // If status is not VERIFIED (e.g. PENDING_APPROVAL, APPROVED_MILESTONE, or REJECTED), redirect to status page
  if (providerStage !== 'VERIFIED') {
    return <Navigate to="/provider/status" replace />;
  }

  const handleLogout = async () => {
    await logoutProvider();
    navigate('/partner');
  };

  const foodTypeLabel =
    providerProfile?.foodType === 'VEG'
      ? 'Pure Vegetarian (100% Veg)'
      : providerProfile?.foodType === 'NON_VEG'
      ? 'Non-Vegetarian'
      : 'Both (Veg & Non-Veg)';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Top Navbar */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight">TiffinHub</span>
              <span className="ml-2 text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Kitchen Partner Portal
              </span>
            </div>
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-bold text-white">
                {providerProfile?.businessName || user?.name}
              </span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified Partner</span>
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 hover:border-red-500/30 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Milestone Banner */}
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Active Kitchen Dashboard</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                Welcome to your Kitchen Hub, {providerProfile?.businessName || user?.name}! 👨‍🍳
              </h1>
              <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
                Your kitchen is officially certified and live on TiffinHub. Here you can configure your daily meal packages, publish weekly menu schedules, and manage incoming subscriber dispatches.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <div className="bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-700/80 text-center">
                <span className="text-[11px] text-slate-400 block font-medium">Status</span>
                <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                  VERIFIED
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Quick Metrics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-semibold text-slate-400 block mb-1">Active Meal Plans</span>
            <div className="text-2xl font-black text-white">0</div>
            <span className="text-[11px] text-emerald-400 font-medium">Ready to create</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-semibold text-slate-400 block mb-1">Total Subscribers</span>
            <div className="text-2xl font-black text-white">0</div>
            <span className="text-[11px] text-slate-500 font-medium">Awaiting first plan</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-semibold text-slate-400 block mb-1">Today's Meals Prep</span>
            <div className="text-2xl font-black text-white">0</div>
            <span className="text-[11px] text-slate-500 font-medium">Dispatch schedule</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <span className="text-xs font-semibold text-slate-400 block mb-1">Total Payouts</span>
            <div className="text-2xl font-black text-white">₹0</div>
            <span className="text-[11px] text-slate-500 font-medium">Direct bank transfers</span>
          </div>
        </div>

        {/* Two-Column Section: Kitchen Profile Info & Management Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Certified Kitchen Profile Info */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {providerProfile?.businessName || 'Your Kitchen'}
                </h3>
                <span className="text-xs text-slate-400">{providerProfile?.city}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Kitchen Facility Address:</span>
                <span className="text-slate-200 font-medium">{providerProfile?.address || '—'}</span>
              </div>

              <div>
                <span className="text-slate-500 block mb-0.5">Contact Number:</span>
                <span className="text-slate-200 font-medium">{providerProfile?.contactNumber || user?.phone || '—'}</span>
              </div>

              <div>
                <span className="text-slate-500 block mb-0.5">Dietary Preparation:</span>
                <span className="text-emerald-400 font-semibold">{foodTypeLabel}</span>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Service & Delivery Areas:</span>
                <div className="flex flex-wrap gap-1">
                  {providerProfile?.serviceArea?.map((area) => (
                    <span
                      key={area}
                      className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] px-2 py-0.5 rounded-md"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {providerProfile?.description && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-500 block mb-0.5">Kitchen Description:</span>
                  <p className="text-slate-400 leading-relaxed text-[11px]">{providerProfile.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Upcoming Functional Modules (Roadmap Preview) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-white">Kitchen Operations & Management</h3>

            {/* Module 1: Tiffin Plans */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 transition-all shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white">Tiffin Plans & Packages</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                      Next Module
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-lg">
                    Define your weekly or monthly subscription packages, prices per meal, and recurring delivery rules.
                  </p>
                </div>
              </div>

              <button
                disabled
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 bg-slate-800/80 border border-slate-700/60 cursor-not-allowed opacity-80 shrink-0"
              >
                <span>Coming Up Next</span>
              </button>
            </div>

            {/* Module 2: Weekly Menus */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 transition-all shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white">Weekly Menu Schedules</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-wider">
                      Upcoming
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-lg">
                    Schedule specific sabzi, dal, bread, and rice items for Monday through Sunday for Breakfast, Lunch, and Dinner.
                  </p>
                </div>
              </div>

              <button
                disabled
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 bg-slate-800/80 border border-slate-700/60 cursor-not-allowed opacity-80 shrink-0"
              >
                <span>Planned</span>
              </button>
            </div>

            {/* Module 3: Active Orders */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 transition-all shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white">Daily Orders & Dispatches</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-wider">
                      Upcoming
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-lg">
                    Real-time list of daily lunch and dinner boxes to pack, delivery addresses, and customer contact notes.
                  </p>
                </div>
              </div>

              <button
                disabled
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 bg-slate-800/80 border border-slate-700/60 cursor-not-allowed opacity-80 shrink-0"
              >
                <span>Planned</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
