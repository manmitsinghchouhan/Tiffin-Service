import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ChefHat,
  LogOut,
  RefreshCw,
  Mail,
  ShieldCheck,
  Building2,
  Phone,
  MapPin,
  Utensils,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProviderStatus() {
  const navigate = useNavigate();
  const {
    user,
    loading,
    providerProfile,
    providerStage,
    logoutProvider,
    checkAuth,
  } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  // Route Guard Checks
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-600">Checking application status...</span>
        </div>
      </div>
    );
  }

  // If not logged in as Provider, redirect to partner login
  if (!user || user.role !== 'PROVIDER') {
    return <Navigate to="/provider/login" replace />;
  }

  // If Step 2 onboarding profile has not been submitted yet, force them to complete Step 2 first!
  if (providerStage === 'NEEDS_PROFILE') {
    return <Navigate to="/provider/onboarding" replace />;
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkAuth();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleLogout = async () => {
    await logoutProvider();
    navigate('/partner');
  };

  const foodTypeLabel =
    providerProfile?.foodType === 'VEG'
      ? 'Pure Vegetarian'
      : providerProfile?.foodType === 'NON_VEG'
      ? 'Non-Vegetarian'
      : 'Both (Veg & Non-Veg)';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white flex items-center justify-center shadow-sm">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold text-slate-900 tracking-tight">
                Tiffin<span className="text-emerald-600">Hub</span>
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Partner Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-slate-200 bg-white transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
              <span>Refresh Status</span>
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-red-200 bg-white transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Status Container */}
      <main className="flex-grow max-w-2xl mx-auto px-4 sm:px-6 py-10 w-full flex flex-col justify-center">
        {/* Status Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-2xl shadow-slate-200/50 text-center relative overflow-hidden">
          {/* Top Amber Status Badge */}
          <div className="w-20 h-20 rounded-full bg-amber-50 border-4 border-amber-100 flex items-center justify-center mx-auto mb-6 text-amber-500 shadow-inner">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            <span>Application Status: Pending Approval</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            {providerProfile?.businessName || 'Your Kitchen'} is Under Review
          </h1>

          <p className="text-slate-600 text-sm leading-relaxed mb-8 max-w-lg mx-auto">
            Your Step 2 onboarding details have been submitted. Our operations team is reviewing your kitchen profile, address, and food standards.
          </p>

          {/* Details Box */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-left mb-6 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Submitted Kitchen Details
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Business / Kitchen</span>
              <span className="font-bold text-slate-800">{providerProfile?.businessName || '—'}</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Owner Name</span>
              <span className="font-bold text-slate-800">{user?.name || 'Partner'}</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Registered Email</span>
              <span className="font-bold text-slate-800">{user?.email || '—'}</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Contact Number</span>
              <span className="font-bold text-slate-800">
                {providerProfile?.contactNumber || user?.phone || '—'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60">
              <span className="text-slate-500">City & Address</span>
              <span className="font-bold text-slate-800 text-right max-w-xs truncate">
                {providerProfile?.city ? `${providerProfile.city} — ${providerProfile.address}` : '—'}
              </span>
            </div>

            {providerProfile?.serviceArea && providerProfile.serviceArea.length > 0 && (
              <div className="text-xs py-1 border-b border-slate-200/60">
                <span className="text-slate-500 block mb-1">Delivery Localities:</span>
                <div className="flex flex-wrap gap-1">
                  {providerProfile.serviceArea.map((area) => (
                    <span
                      key={area}
                      className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-md"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Food Type</span>
              <span className="font-bold text-slate-800">{foodTypeLabel}</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-500">Current Review Stage</span>
              <span className="font-bold text-amber-700 bg-amber-100/90 px-2.5 py-0.5 rounded-md text-xs">
                PENDING APPROVAL
              </span>
            </div>
          </div>

          {/* What happens next box */}
          <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-100 text-left mb-8">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>What Happens Next?</span>
            </h4>
            <ul className="text-xs text-emerald-900 space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600">•</span>
                <span>Our operations team reviews kitchen hygiene and locality coverage within <strong>24 to 48 hours</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600">•</span>
                <span>You will receive an update at your registered email: <strong>{user?.email}</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-600">•</span>
                <span>Once approved by admin, you will gain access to your Provider Dashboard to publish tiffin plans & menus!</span>
              </li>
            </ul>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleRefresh}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all cursor-pointer shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Check for Status Updates</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out for Now</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
