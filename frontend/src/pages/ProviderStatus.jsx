import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
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
  PartyPopper,
  Sparkles,
  ArrowRight,
  XCircle,
  Edit3,
  Calendar,
  Check,
  Plus,
  X,
  Store,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CITY_AREAS = {
  Ahmedabad: [
    'Navrangpura',
    'Ambawadi',
    'University Area',
    'Satellite',
    'Vastrapur',
    'Prahlad Nagar',
    'Maninagar',
    'Bopal',
    'SG Highway',
  ],
  Mumbai: [
    'Andheri',
    'Bandra',
    'Powai',
    'Dadar',
    'Malad',
    'Borivali',
    'Goregaon',
  ],
  Pune: ['Kothrud', 'Viman Nagar', 'Hinjewadi', 'Baner', 'Wakad', 'Aundh'],
  'Delhi NCR': [
    'Connaught Place',
    'Noida Sector 62',
    'Gurugram Cyber City',
    'Hauz Khas',
    'Dwarka',
  ],
  Bangalore: [
    'Koramangala',
    'HSR Layout',
    'Indiranagar',
    'Whitefield',
    'Electronic City',
  ],
};

export default function ProviderStatus() {
  const navigate = useNavigate();
  const {
    user,
    loading,
    providerProfile,
    providerStage,
    logoutProvider,
    checkAuth,
    acknowledgeApproval,
    reapplyProvider,
  } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Re-apply edit form state (used if REJECTED)
  const [isEditing, setIsEditing] = useState(false);
  const [reapplyData, setReapplyData] = useState({
    businessName: providerProfile?.businessName || '',
    contactNumber: providerProfile?.contactNumber || user?.phone || '',
    address: providerProfile?.address || '',
    city: providerProfile?.city || 'Ahmedabad',
    serviceArea: providerProfile?.serviceArea || ['Navrangpura', 'Ambawadi'],
    foodType: providerProfile?.foodType || 'BOTH',
    description: providerProfile?.description || '',
    imageUrl: providerProfile?.imageUrl || '',
  });
  const [customAreaInput, setCustomAreaInput] = useState('');

  // Robust status flags combining providerStage and providerProfile verification fields
  const isApprovedMilestone =
    providerStage === 'APPROVED_MILESTONE' ||
    (providerProfile?.verificationStatus === 'VERIFIED' && !providerProfile?.hasAcknowledgedApproval);

  const isRejected =
    providerStage === 'REJECTED' ||
    providerProfile?.verificationStatus === 'REJECTED';

  const isPending =
    !isApprovedMilestone && !isRejected && (
      providerStage === 'PENDING_APPROVAL' ||
      providerProfile?.verificationStatus === 'PENDING'
    );

  // Auto-poll quietly in the background every 4 seconds while awaiting review
  // so when an admin verifies the provider, the celebratory milestone triggers automatically!
  useEffect(() => {
    checkAuth(false);
    const interval = setInterval(() => {
      checkAuth(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [checkAuth]);

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

  // If Step 2 onboarding profile has not been submitted yet, force them to complete Step 2 first
  if (providerStage === 'NEEDS_PROFILE') {
    return <Navigate to="/provider/onboarding" replace />;
  }

  // If provider has already acknowledged their approval and is VERIFIED, redirect directly to dashboard
  if (providerStage === 'VERIFIED' || (providerProfile?.verificationStatus === 'VERIFIED' && providerProfile?.hasAcknowledgedApproval)) {
    return <Navigate to="/provider/dashboard" replace />;
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    setError('');
    await checkAuth(false);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleLogout = async () => {
    await logoutProvider();
    navigate('/partner');
  };

  // Launch Dashboard Milestone Handler
  const handleLaunchDashboard = async () => {
    setSubmittingAction(true);
    setError('');
    try {
      await acknowledgeApproval();
      navigate('/provider/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to unlock dashboard access.');
      setSubmittingAction(false);
    }
  };

  // Re-apply Form Submit Handler
  const handleReapplySubmit = async (e) => {
    e.preventDefault();
    setSubmittingAction(true);
    setError('');
    setSuccessMessage('');
    try {
      await reapplyProvider(reapplyData);
      setSuccessMessage('Application re-submitted successfully! Status moved to Pending Review.');
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to resubmit application.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleToggleArea = (area) => {
    setReapplyData((prev) => {
      const exists = prev.serviceArea.includes(area);
      const updated = exists
        ? prev.serviceArea.filter((a) => a !== area)
        : [...prev.serviceArea, area];
      return { ...prev, serviceArea: updated };
    });
  };

  const handleAddCustomArea = (e) => {
    e?.preventDefault();
    const trimmed = customAreaInput.trim();
    if (!trimmed) return;
    if (!reapplyData.serviceArea.includes(trimmed)) {
      setReapplyData((prev) => ({
        ...prev,
        serviceArea: [...prev.serviceArea, trimmed],
      }));
    }
    setCustomAreaInput('');
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
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start gap-3 shadow-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
            <div className="flex-1 font-medium">{successMessage}</div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STATE 1: CELEBRATORY APPROVAL MILESTONE SCREEN (APPROVED_MILESTONE) */}
        {/* ============================================================== */}
        {isApprovedMilestone && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-emerald-500/30 shadow-2xl shadow-emerald-500/10 text-center relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-200/40 rounded-full blur-3xl pointer-events-none"></div>

            {/* Celebratory Icon */}
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-emerald-600/30 mx-auto transform -rotate-3 hover:rotate-0 transition-transform">
                <PartyPopper className="w-12 h-12" />
              </div>
              <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-900 rounded-full p-1.5 shadow-md animate-bounce">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>

            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-100/80 border border-emerald-200 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest mb-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Application Approved!</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
              Congratulations, {providerProfile?.businessName || user?.name}! 🎉
            </h1>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8 max-w-lg mx-auto">
              Our operations team has completed the verification review. Your kitchen is officially approved and certified to serve hungry customers on <strong>TiffinHub</strong>.
            </p>

            {/* What's Unlocked Summary Box */}
            <div className="bg-emerald-50/60 rounded-2xl p-6 border border-emerald-200/80 text-left mb-8 space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Your Certified Partner Privileges</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                <div className="flex items-start gap-2.5 bg-white/80 p-3 rounded-xl border border-emerald-100">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Verified Kitchen Badge:</strong> Builds immediate subscriber trust.</span>
                </div>
                <div className="flex items-start gap-2.5 bg-white/80 p-3 rounded-xl border border-emerald-100">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Tiffin Packages:</strong> Publish customized meal pricing & terms.</span>
                </div>
                <div className="flex items-start gap-2.5 bg-white/80 p-3 rounded-xl border border-emerald-100">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Weekly Menus:</strong> Set Breakfast, Lunch & Dinner rotations.</span>
                </div>
                <div className="flex items-start gap-2.5 bg-white/80 p-3 rounded-xl border border-emerald-100">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Direct Orders:</strong> Receive daily recurring subscriber dispatch lists.</span>
                </div>
              </div>
            </div>

            {/* Primary Action Button: Launch Kitchen Dashboard */}
            <div className="space-y-3">
              <button
                onClick={handleLaunchDashboard}
                disabled={submittingAction}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/30 hover:shadow-2xl hover:shadow-emerald-600/40 transform hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {submittingAction ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Launching Dashboard...</span>
                  </>
                ) : (
                  <>
                    <span>Launch Kitchen Dashboard</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="text-[11px] text-slate-400">
                Clicking activates your permanent dashboard navigation.
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STATE 2: REJECTED STATE WITH RE-APPLICATION FORM (REJECTED)    */}
        {/* ============================================================== */}
        {isRejected && (
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-red-200 shadow-2xl shadow-red-500/5 text-center relative overflow-hidden">
            {/* Top Red Badge */}
            <div className="w-20 h-20 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center mx-auto mb-6 text-red-500 shadow-inner">
              <XCircle className="w-10 h-10" />
            </div>

            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>Application Requires Attention</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              Application Not Approved
            </h1>

            <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-lg mx-auto">
              Our review team encountered an issue with your kitchen application. You can address the reason below and resubmit for immediate re-review.
            </p>

            {/* Rejection Reason Notice Box */}
            <div className="bg-red-50/80 rounded-2xl p-5 border border-red-200 text-left mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-red-800 block mb-1">
                Feedback from Review Team:
              </span>
              <p className="text-sm font-semibold text-red-900 leading-relaxed">
                "{providerProfile?.rejectionReason || 'Please verify your kitchen details and contact info.'}"
              </p>
            </div>

            {/* Toggle Re-Apply Form */}
            {!isEditing ? (
              <div className="space-y-4">
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all cursor-pointer shadow-md"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Update Kitchen Details & Re-Apply</span>
                </button>

                <div className="text-xs text-slate-500">
                  Questions? Reach out to our partner support team at{' '}
                  <span className="text-blue-600 font-semibold">support@tiffinhub.com</span>
                </div>
              </div>
            ) : (
              /* Inline Re-Apply Form */
              <form onSubmit={handleReapplySubmit} className="text-left space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-900">
                  Update and Resubmit Kitchen Details:
                </h4>

                {/* Business Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    required
                    value={reapplyData.businessName}
                    onChange={(e) => setReapplyData({ ...reapplyData, businessName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={reapplyData.contactNumber}
                    onChange={(e) => setReapplyData({ ...reapplyData, contactNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Address & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kitchen Address
                    </label>
                    <input
                      type="text"
                      required
                      value={reapplyData.address}
                      onChange={(e) => setReapplyData({ ...reapplyData, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      City
                    </label>
                    <select
                      value={reapplyData.city}
                      onChange={(e) => setReapplyData({ ...reapplyData, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Ahmedabad">Ahmedabad</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Pune">Pune</option>
                      <option value="Delhi NCR">Delhi NCR</option>
                      <option value="Bangalore">Bangalore</option>
                    </select>
                  </div>
                </div>

                {/* Localities */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Selected Service Localities:
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {reapplyData.serviceArea.map((area) => (
                      <span
                        key={area}
                        className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      >
                        <span>{area}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleArea(area)}
                          className="hover:bg-emerald-700 rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customAreaInput}
                      onChange={(e) => setCustomAreaInput(e.target.value)}
                      placeholder="Type locality and press add"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomArea}
                      className="px-3 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Food Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Food Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['VEG', 'NON_VEG', 'BOTH'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setReapplyData({ ...reapplyData, foodType: type })}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                          reapplyData.foodType === type
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        {type === 'VEG' ? 'Pure Veg' : type === 'NON_VEG' ? 'Non-Veg' : 'Both'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submittingAction ? 'Submitting...' : 'Submit Re-Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* STATE 3: PENDING APPROVAL REVIEW STATUS SCREEN (PENDING)       */}
        {/* ============================================================== */}
        {isPending && (
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
                  <span>Once approved by admin, you will see your celebration screen and unlock your Kitchen Dashboard!</span>
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
        )}
      </main>
    </div>
  );
}
