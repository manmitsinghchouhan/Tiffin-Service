import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Package,
  Heart,
  MapPin,
  User,
  LogOut,
  Bell,
  ArrowRight,
  Pause,
  Play,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Utensils,
  ChevronRight,
  ShieldCheck,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user, isCustomer, logoutCustomer } = useAuth();

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'

  // Action Modals State
  const [updatingAddressSub, setUpdatingAddressSub] = useState(null);
  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    postalCode: '',
    landmark: '',
    contactPhone: '',
    notes: '',
  });
  const [cancellingSub, setCancellingSub] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // Fetch Subscriptions
  const fetchSubscriptions = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get('/customer/subscriptions')
      .then((res) => {
        setSubscriptions(res.data?.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load subscriptions');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Pause subscription
  const handlePause = async (subId) => {
    setActionLoading(true);
    setActionMessage('Pausing subscription...');
    try {
      await api.patch(`/customer/subscriptions/${subId}/pause`);
      fetchSubscriptions();
    } catch (err) {
      alert(err.message || 'Failed to pause subscription');
    } finally {
      setActionLoading(false);
      setActionMessage(null);
    }
  };

  // Resume subscription
  const handleResume = async (subId) => {
    setActionLoading(true);
    setActionMessage('Resuming subscription and extending delivery schedule...');
    try {
      await api.patch(`/customer/subscriptions/${subId}/resume`);
      fetchSubscriptions();
    } catch (err) {
      alert(err.message || 'Failed to resume subscription');
    } finally {
      setActionLoading(false);
      setActionMessage(null);
    }
  };

  // Cancel subscription
  const handleCancel = async () => {
    if (!cancellingSub) return;
    setActionLoading(true);
    try {
      await api.patch(`/customer/subscriptions/${cancellingSub._id}/cancel`);
      setCancellingSub(null);
      fetchSubscriptions();
    } catch (err) {
      alert(err.message || 'Failed to cancel subscription');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Auto-Renewal
  const handleToggleAutoRenew = async (sub) => {
    setActionLoading(true);
    try {
      await api.patch(`/customer/subscriptions/${sub._id}/auto-renew`, {
        autoRenewal: !sub.autoRenewal,
      });
      fetchSubscriptions();
    } catch (err) {
      alert(err.message || 'Failed to toggle auto-renewal');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Update Address modal
  const openAddressModal = (sub) => {
    setUpdatingAddressSub(sub);
    setAddressForm({
      street: sub.deliveryAddress?.street || '',
      city: sub.deliveryAddress?.city || '',
      postalCode: sub.deliveryAddress?.postalCode || '',
      landmark: sub.deliveryAddress?.landmark || '',
      contactPhone: sub.deliveryAddress?.contactPhone || '',
      notes: sub.notes || '',
    });
  };

  // Save updated address
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!updatingAddressSub) return;
    setActionLoading(true);
    try {
      await api.patch(
        `/customer/subscriptions/${updatingAddressSub._id}/address`,
        addressForm
      );
      setUpdatingAddressSub(null);
      fetchSubscriptions();
    } catch (err) {
      alert(err.message || 'Failed to update address');
    } finally {
      setActionLoading(false);
    }
  };

  // Split Active vs History
  const activeSubs = subscriptions.filter(
    (s) => s.status === 'ACTIVE' || s.status === 'PAUSED'
  );
  const historySubs = subscriptions.filter(
    (s) => s.status === 'EXPIRED' || s.status === 'CANCELLED'
  );

  return (
    <div className="min-h-screen bg-[#f8fafd] flex">
      
      {/* ================= LEFT SIDEBAR (Matches Screen 5) ================= */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-6 shrink-0 hidden md:flex">
        <div>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-10 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 3h6M12 3v3" />
                <rect x="5" y="6" width="14" height="4" rx="2" />
                <rect x="5" y="11" width="14" height="4" rx="2" />
                <rect x="5" y="16" width="14" height="4" rx="2" />
                <path d="M4 8v10M20 8v10" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 leading-none block">
                Tiffin<span className="text-blue-600">Hub</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Good Food. Better Days.</span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-blue-600" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>My Subscriptions</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Package className="w-4 h-4 text-slate-400" />
              <span>Orders & History</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/#subscription')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Heart className="w-4 h-4 text-slate-400" />
              <span>Saved Kitchens</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (activeSubs.length > 0) openAddressModal(activeSubs[0]);
                else alert('No active subscriptions to view address book.');
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>Address Book</span>
            </button>
          </nav>
        </div>

        {/* Bottom Log Out */}
        <div className="pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={logoutCustomer}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50/70 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN DASHBOARD CONTAINER ================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="h-20 bg-white border-b border-slate-100 px-6 sm:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-800">Customer Portal</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200/80 cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200/70">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-slate-800 block leading-tight">
                  {user?.name || 'Customer'}
                </span>
                <span className="text-[10px] text-blue-600 font-semibold block leading-tight">
                  Customer
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body Content */}
        <main className="p-6 sm:p-8 lg:p-10 max-w-6xl w-full mx-auto space-y-8">
          
          {/* Main Title & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                My Subscriptions
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Manage your tiffin subscriptions and track your deliveries.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/#subscription')}
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto"
            >
              <span>Browse Kitchens</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-Tabs: Active (N) | History (N) */}
          <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              Active ({activeSubs.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              History ({historySubs.length})
            </button>
          </div>

          {/* Action Loading Banner */}
          {actionLoading && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-2xl flex items-center gap-2.5 animate-fadeIn">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="font-semibold">{actionMessage || 'Updating subscription...'}</span>
            </div>
          )}

          {/* Loading Skeletons */}
          {loading && (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm animate-pulse space-y-6">
              <div className="h-6 bg-slate-200 rounded w-1/4" />
              <div className="h-32 bg-slate-100 rounded-2xl" />
              <div className="grid grid-cols-3 gap-4">
                <div className="h-20 bg-slate-100 rounded-xl" />
                <div className="h-20 bg-slate-100 rounded-xl" />
                <div className="h-20 bg-slate-100 rounded-xl" />
              </div>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="bg-white rounded-3xl p-10 text-center max-w-md mx-auto border border-red-100 shadow-sm">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">Failed to load subscriptions</h3>
              <p className="text-xs text-slate-500 mb-4">{error}</p>
              <button
                onClick={fetchSubscriptions}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* ================= TAB 1: ACTIVE SUBSCRIPTIONS ================= */}
          {!loading && !error && activeTab === 'active' && (
            <>
              {activeSubs.length === 0 ? (
                /* Empty Active Subscriptions State */
                <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto border border-slate-200/80 shadow-md">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                    <Utensils className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No Active Subscriptions</h3>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    You do not have any active tiffin meal plans right now. Explore top verified kitchens near you and start your everyday meals.
                  </p>
                  <button
                    onClick={() => navigate('/#subscription')}
                    className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>Explore Tiffin Services</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Active Subscription Cards List */
                <div className="space-y-6">
                  {activeSubs.map((sub) => {
                    const isPaused = sub.status === 'PAUSED';
                    const durationDays = sub.planSnapshot?.durationDays || 30;
                    const remainingDays = sub.remainingDays !== undefined ? sub.remainingDays : 21;
                    const daysCompleted = Math.max(1, Math.min(durationDays, durationDays - remainingDays));
                    const progressPercent = Math.min(100, Math.round((daysCompleted / durationDays) * 100));

                    const kitchenName = sub.providerId?.businessName || 'Verified Kitchen';
                    const planName = sub.planSnapshot?.name || 'Monthly Tiffin Plan';
                    const mealType = sub.planSnapshot?.mealType || 'LUNCH';
                    const diet = sub.planSnapshot?.diet || 'VEG';
                    const price = sub.totalAmount || 2400;

                    const bannerImg =
                      sub.providerId?.imageUrl ||
                      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80';

                    return (
                      <div
                        key={sub._id}
                        className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden p-6 sm:p-8 space-y-6"
                      >
                        {/* Top Row: Kitchen + Plan Info & Progress Tracker (Matches Screen 5) */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                          
                          {/* Left: Banner Photo + Titles + Badges */}
                          <div className="flex items-start sm:items-center gap-4">
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                              <img
                                src={bannerImg}
                                alt={kitchenName}
                                className="w-full h-full object-cover"
                              />
                              {/* Status Badge */}
                              <div className="absolute top-1.5 left-1.5">
                                {isPaused ? (
                                  <span className="bg-amber-500/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                    Paused
                                  </span>
                                ) : (
                                  <span className="bg-emerald-500/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                    Active
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                                {kitchenName}
                              </h3>
                              <p className="text-sm font-semibold text-slate-700">
                                {planName}
                              </p>

                              {/* Badges */}
                              <div className="flex flex-wrap items-center gap-1.5 text-xs pt-0.5">
                                <span className="bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1">
                                  <Utensils className="w-3 h-3 text-blue-600" />
                                  {mealType.replace('_', ' ')}
                                </span>
                                <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                                  diet === 'VEG'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}>
                                  {diet === 'VEG' ? '🌱 Veg' : '🍗 Non-Veg'}
                                </span>
                                <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md text-[11px]">
                                  All Days
                                </span>
                              </div>

                              <div className="text-base font-black text-blue-600 pt-1">
                                ₹{price.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ {durationDays} days</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Progress Tracker (Day X of Y + Bar) */}
                          <div className="lg:w-72 bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-2 shrink-0">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-900">
                                Day {daysCompleted} of {durationDays}
                              </span>
                              <span className="font-extrabold text-blue-600">
                                {progressPercent}%
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  isPaused ? 'bg-amber-500' : 'bg-blue-600'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>

                            {/* Dates */}
                            <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                              <div>
                                <span>Start Date</span>
                                <p className="font-bold text-slate-800">{formatDate(sub.startDate)}</p>
                              </div>
                              <div className="text-right">
                                <span>End Date</span>
                                <p className="font-bold text-slate-800">{formatDate(sub.endDate)}</p>
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* Conditional Alert Banner (If Paused) - Matches Screen 6 */}
                        {isPaused && (
                          <div className="p-4 bg-amber-50/80 border border-amber-200 text-amber-800 text-xs rounded-2xl flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold">Subscription paused on {formatDate(sub.pausedAt || new Date())}</p>
                              <p className="text-[11px] text-amber-700">
                                We will automatically extend your delivery end date by the exact paused period when you resume.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Action Controls Bar */}
                        <div className="flex flex-wrap items-center gap-3">
                          {isPaused ? (
                            /* Resume Button */
                            <button
                              type="button"
                              onClick={() => handleResume(sub._id)}
                              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                            >
                              <Play className="w-4 h-4 fill-white" />
                              <span>Resume Subscription</span>
                            </button>
                          ) : (
                            /* Pause Button */
                            <button
                              type="button"
                              onClick={() => handlePause(sub._id)}
                              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                            >
                              <Pause className="w-4 h-4 text-slate-500" />
                              <span>Pause Subscription</span>
                            </button>
                          )}

                          {/* Update Address Button */}
                          <button
                            type="button"
                            onClick={() => openAddressModal(sub)}
                            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4 text-slate-500" />
                            <span>Update Address</span>
                          </button>

                          {/* Cancel Subscription Button */}
                          <button
                            type="button"
                            onClick={() => setCancellingSub(sub)}
                            className="inline-flex items-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all cursor-pointer ml-auto"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Cancel Subscription</span>
                          </button>
                        </div>

                        {/* Bottom 3-Column Info Grid (Matches Screen 5) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                          
                          {/* Col 1: Today's Meal */}
                          <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                              <Utensils className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                                Today's Meal
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                                  {isPaused ? 'On Hold' : 'Preparing'}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 block mt-1">
                                Expected: 12:30 PM - 2:00 PM
                              </span>
                            </div>
                          </div>

                          {/* Col 2: Delivery Address */}
                          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                              <MapPin className="w-5 h-5" />
                            </div>
                            <div className="overflow-hidden">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                                Delivery Address
                              </span>
                              <p className="text-xs font-bold text-slate-800 truncate mt-0.5">
                                {sub.deliveryAddress?.street || 'Home Address'}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {sub.deliveryAddress?.city} {sub.deliveryAddress?.postalCode}
                                {sub.deliveryAddress?.landmark ? ` • ${sub.deliveryAddress.landmark}` : ''}
                              </p>
                            </div>
                          </div>

                          {/* Col 3: Auto-Renewal */}
                          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3.5 overflow-hidden">
                              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                <RefreshCw className="w-5 h-5" />
                              </div>
                              <div className="overflow-hidden">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                                  Auto-Renewal
                                </span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md inline-block mt-0.5 ${
                                  sub.autoRenewal
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {sub.autoRenewal ? 'Enabled' : 'Disabled'}
                                </span>
                                <span className="text-[11px] text-slate-500 block mt-1 truncate">
                                  {sub.autoRenewal ? `Renews on ${formatDate(sub.endDate)}` : 'Expires on completion'}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleAutoRenew(sub)}
                              className="text-[11px] text-blue-600 hover:underline font-bold shrink-0 cursor-pointer"
                            >
                              Toggle
                            </button>
                          </div>

                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ================= TAB 2: SUBSCRIPTION HISTORY (Matches Screen 6) ================= */}
          {!loading && !error && activeTab === 'history' && (
            <div className="space-y-6">
              {historySubs.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center max-w-md mx-auto border border-slate-200/80">
                  <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-700">No Past Subscriptions</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Completed and expired subscriptions will be logged here.
                  </p>
                </div>
              ) : (
                historySubs.map((sub) => {
                  const kitchenName = sub.providerId?.businessName || 'Kitchen Provider';
                  const planName = sub.planSnapshot?.name || 'Tiffin Plan';
                  const price = sub.totalAmount || 1800;
                  const isCancelled = sub.status === 'CANCELLED';

                  return (
                    <div
                      key={sub._id}
                      className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 space-y-4 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isCancelled
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {isCancelled ? '● Cancelled' : '● Completed'}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDate(sub.startDate)} - {formatDate(sub.endDate)}
                          </span>
                        </div>

                        <span className="text-sm font-bold text-slate-900">
                          ₹{price.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-base font-bold text-slate-900">{kitchenName}</h4>
                          <p className="text-xs text-slate-500">{planName}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => alert(`Subscription #${sub._id}\nKitchen: ${kitchenName}\nPlan: ${planName}\nTotal Paid: ₹${price}`)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          View Details
                        </button>
                      </div>

                      {/* Alert banner for cancelled */}
                      {isCancelled && (
                        <div className="p-3 bg-red-50/70 border border-red-100 text-red-700 text-xs rounded-xl flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                          <span>Subscription was cancelled. Access ended on {formatDate(sub.updatedAt)}.</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

        </main>
      </div>

      {/* ================= MODAL: UPDATE ADDRESS ================= */}
      {updatingAddressSub && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="fixed inset-0 -z-10" onClick={() => setUpdatingAddressSub(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 my-auto animate-scaleUp">
            <button
              type="button"
              onClick={() => setUpdatingAddressSub(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-1">Update Delivery Address</h3>
            <p className="text-xs text-slate-500 mb-5">
              Changes will apply to your upcoming meal dispatches immediately.
            </p>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={addressForm.landmark}
                  onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  required
                  value={addressForm.contactPhone}
                  onChange={(e) => setAddressForm({ ...addressForm, contactPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Notes</label>
                <textarea
                  rows={2}
                  value={addressForm.notes}
                  onChange={(e) => setAddressForm({ ...addressForm, notes: e.target.value })}
                  placeholder="e.g. Leave with security desk"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setUpdatingAddressSub(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  {actionLoading ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CANCEL SUBSCRIPTION CONFIRMATION ================= */}
      {cancellingSub && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="fixed inset-0 -z-10" onClick={() => setCancellingSub(null)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 my-auto text-center animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">Cancel Subscription?</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to cancel your subscription to{' '}
              <span className="font-bold text-slate-800">
                {cancellingSub.planSnapshot?.name || 'this meal plan'}
              </span>
              ? Your upcoming meal dispatches will be stopped immediately.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCancellingSub(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Keep Subscription
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-500/20 cursor-pointer"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
