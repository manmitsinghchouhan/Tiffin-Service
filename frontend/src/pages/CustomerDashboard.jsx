import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Package,
  Heart,
  MapPin,
  User as UserIcon,
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
  AlertCircle,
  Plus,
  Home,
  Building2,
  Sparkles,
  Navigation
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

const CUSTOMER_CANCEL_REASONS = [
  "Relocating / Moving to a different address",
  "Food taste / spice level preference",
  "Delivery timing doesn't suit schedule",
  "Temporary break / Personal travel",
  "Budget or financial constraints",
  "Other reason (please specify)",
];

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isCustomer, logoutCustomer, loading: authLoading } = useAuth();

  // Redirect to Home if logged out or not a customer
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'CUSTOMER')) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleLogout = async () => {
    try {
      await logoutCustomer();
    } finally {
      navigate('/', { replace: true });
    }
  };

  // URL Tab Synchronization: 'overview' | 'subscriptions' | 'addresses' | 'history'
  const tabQuery = searchParams.get('tab');
  const [mainTab, setMainTab] = useState(
    tabQuery === 'subscriptions' || tabQuery === 'addresses' || tabQuery === 'history'
      ? tabQuery
      : 'overview'
  );

  // Sub-filter inside My Subscriptions: 'active' | 'pending' | 'history'
  const [subFilter, setSubFilter] = useState('active');

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Address Book State
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null); // null = new, object = edit
  const [addressFormData, setAddressFormData] = useState({
    label: 'Home',
    street: '',
    city: '',
    postalCode: '',
    landmark: '',
    contactPhone: '',
    isDefault: false,
  });

  // Action Modals State
  const [updatingAddressSub, setUpdatingAddressSub] = useState(null);
  const [subAddressForm, setSubAddressForm] = useState({
    street: '',
    city: '',
    postalCode: '',
    landmark: '',
    contactPhone: '',
    notes: '',
  });

  const [cancellingSub, setCancellingSub] = useState(null);
  const [cancelReason, setCancelReason] = useState(CUSTOMER_CANCEL_REASONS[0]);
  const [cancelNote, setCancelNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Sync state if URL query changes
  useEffect(() => {
    if (tabQuery === 'subscriptions' || tabQuery === 'addresses' || tabQuery === 'history') {
      setMainTab(tabQuery);
    } else if (!tabQuery || tabQuery === 'overview') {
      setMainTab('overview');
    }
  }, [tabQuery]);

  const handleTabSwitch = (newTab) => {
    setMainTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Fetch Subscriptions (supports silent background polling)
  const fetchSubscriptions = useCallback((isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
      setError(null);
    }
    api.get('/customer/subscriptions')
      .then((res) => {
        const newData = res.data?.data || [];
        setSubscriptions((prevSubs) => {
          // Detect if any previously pending subscription transitioned to ACTIVE
          const prevPendingIds = new Set(
            prevSubs.filter((s) => s.status === 'PENDING').map((s) => s._id)
          );
          if (prevPendingIds.size > 0) {
            const newlyApproved = newData.find(
              (s) => prevPendingIds.has(s._id) && s.status === 'ACTIVE'
            );
            if (newlyApproved) {
              const kName = newlyApproved.providerId?.businessName || 'The kitchen';
              setToastMessage({
                type: 'success',
                text: `🎉 Great news! Your subscription with ${kName} has been approved and is now active!`,
              });
              setTimeout(() => setToastMessage(null), 8000);
            }
          }
          return newData;
        });
        if (!isSilent) setLoading(false);
      })
      .catch((err) => {
        if (!isSilent) {
          setError(err.message || 'Failed to load subscriptions');
          setLoading(false);
        }
      });
  }, []);

  // Fetch Customer Address Book
  const fetchAddresses = useCallback(async () => {
    try {
      setLoadingAddresses(true);
      const res = await api.get('/customer/addresses');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setAddresses(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load address book:', err);
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
    fetchAddresses();
  }, [fetchSubscriptions, fetchAddresses]);

  // Live Auto-Polling while customer has any pending subscriptions
  useEffect(() => {
    const hasPending = subscriptions.some((s) => s.status === 'PENDING');
    if (!hasPending) return;

    const interval = setInterval(() => {
      fetchSubscriptions(true);
    }, 6000);

    const handleFocus = () => {
      fetchSubscriptions(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [subscriptions, fetchSubscriptions]);

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

  // Cancel subscription with reason and optional note
  const handleCancel = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!cancellingSub) return;

    let finalReason = cancelReason;
    if (cancelReason === "Other reason (please specify)") {
      if (!cancelNote.trim()) {
        alert("Please provide a brief reason for cancellation.");
        return;
      }
      finalReason = cancelNote.trim();
    } else if (cancelNote.trim()) {
      finalReason = `${cancelReason}: ${cancelNote.trim()}`;
    }

    setActionLoading(true);
    try {
      await api.patch(`/customer/subscriptions/${cancellingSub._id}/cancel`, {
        reason: finalReason,
      });
      setCancellingSub(null);
      setCancelReason(CUSTOMER_CANCEL_REASONS[0]);
      setCancelNote("");
      fetchSubscriptions();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to cancel subscription');
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

  // Open Update Subscription Address modal
  const openSubscriptionAddressModal = (sub) => {
    setUpdatingAddressSub(sub);
    setSubAddressForm({
      street: sub.deliveryAddress?.street || '',
      city: sub.deliveryAddress?.city || '',
      postalCode: sub.deliveryAddress?.postalCode || '',
      landmark: sub.deliveryAddress?.landmark || '',
      contactPhone: sub.deliveryAddress?.contactPhone || '',
      notes: sub.notes || '',
    });
  };

  // Save updated address on a subscription
  const handleSaveSubscriptionAddress = async (e) => {
    e.preventDefault();
    if (!updatingAddressSub) return;
    setActionLoading(true);
    try {
      await api.patch(
        `/customer/subscriptions/${updatingAddressSub._id}/address`,
        subAddressForm
      );
      setUpdatingAddressSub(null);
      fetchSubscriptions();
      fetchAddresses();
    } catch (err) {
      alert(err.message || 'Failed to update address');
    } finally {
      setActionLoading(false);
    }
  };

  // Address Book Management Handlers
  const handleOpenAddAddressModal = () => {
    setEditingAddress(null);
    setAddressFormData({
      label: 'Home',
      street: '',
      city: '',
      postalCode: '',
      landmark: '',
      contactPhone: user?.phone || '',
      isDefault: addresses.length === 0,
    });
    setAddressModalOpen(true);
  };

  const handleOpenEditAddressModal = (addr) => {
    setEditingAddress(addr);
    setAddressFormData({
      label: addr.label || 'Home',
      street: addr.street || '',
      city: addr.city || '',
      postalCode: addr.postalCode || '',
      landmark: addr.landmark || '',
      contactPhone: addr.contactPhone || user?.phone || '',
      isDefault: Boolean(addr.isDefault),
    });
    setAddressModalOpen(true);
  };

  const handleSaveAddressBookEntry = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingAddress) {
        await api.put(`/customer/addresses/${editingAddress._id}`, addressFormData);
      } else {
        await api.post('/customer/addresses', addressFormData);
      }
      setAddressModalOpen(false);
      fetchAddresses();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to save address');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAddressBookEntry = async (addrId) => {
    if (!window.confirm('Are you sure you want to delete this address from your Address Book?')) {
      return;
    }
    setActionLoading(true);
    try {
      await api.delete(`/customer/addresses/${addrId}`);
      fetchAddresses();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete address');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetDefaultAddressBookEntry = async (addrId) => {
    setActionLoading(true);
    try {
      await api.patch(`/customer/addresses/${addrId}/default`);
      fetchAddresses();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update default address');
    } finally {
      setActionLoading(false);
    }
  };

  // Split Active vs Pending vs History
  const activeSubs = subscriptions.filter(
    (s) => s.status === 'ACTIVE' || s.status === 'PAUSED'
  );
  const pendingSubs = subscriptions.filter(
    (s) => s.status === 'PENDING'
  );
  const historySubs = subscriptions.filter(
    (s) => s.status === 'EXPIRED' || s.status === 'CANCELLED'
  );

  // Today's Upcoming Meal (from first active subscription)
  const todaySub = activeSubs[0] || null;

  return (
    <div className="min-h-screen bg-[#f8fafd] flex">
      
      {/* ================= LEFT SIDEBAR ================= */}
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

          {/* Navigation Items (Cleanly Decoupled) */}
          <nav className="space-y-1.5">
            {/* 1. Dashboard Overview */}
            <button
              type="button"
              onClick={() => handleTabSwitch('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                mainTab === 'overview'
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 ${mainTab === 'overview' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Dashboard</span>
            </button>

            {/* 2. My Subscriptions */}
            <button
              type="button"
              onClick={() => {
                handleTabSwitch('subscriptions');
                if (pendingSubs.length > 0 && activeSubs.length === 0) {
                  setSubFilter('pending');
                }
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                mainTab === 'subscriptions'
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className={`w-4 h-4 ${mainTab === 'subscriptions' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>My Subscriptions</span>
              </div>
              {pendingSubs.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-2xs">
                  {pendingSubs.length}
                </span>
              )}
            </button>

            {/* 3. Address Book */}
            <button
              type="button"
              onClick={() => handleTabSwitch('addresses')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                mainTab === 'addresses'
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin className={`w-4 h-4 ${mainTab === 'addresses' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Address Book</span>
              </div>
              {addresses.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                  {addresses.length}
                </span>
              )}
            </button>

            {/* 4. Orders & History */}
            <button
              type="button"
              onClick={() => handleTabSwitch('history')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                mainTab === 'history'
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Package className={`w-4 h-4 ${mainTab === 'history' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Orders & History</span>
            </button>

            {/* 5. Saved Kitchens */}
            <button
              type="button"
              onClick={() => navigate('/#subscription')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Heart className="w-4 h-4 text-slate-400" />
              <span>Saved Kitchens</span>
            </button>
          </nav>
        </div>

        {/* Bottom Log Out */}
        <div className="pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={handleLogout}
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
            <span className="text-slate-800">
              {mainTab === 'overview'
                ? 'Dashboard Overview'
                : mainTab === 'subscriptions'
                ? 'My Subscriptions'
                : mainTab === 'addresses'
                ? 'Address Book'
                : 'Orders & History'}
            </span>
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
          
          {/* Toast Notification Banner (e.g., when a subscription gets approved live) */}
          {toastMessage && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center justify-between gap-3 text-emerald-950 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-emerald-900">{toastMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Pending Approval Notification Banner */}
          {pendingSubs.length > 0 && mainTab !== 'subscriptions' && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-2xs animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-amber-950">
                    You have {pendingSubs.length} subscription request{pendingSubs.length > 1 ? 's' : ''} awaiting kitchen confirmation
                  </p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    The kitchen is reviewing daily capacity. Deliveries begin on your scheduled start date upon approval.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleTabSwitch('subscriptions');
                  setSubFilter('pending');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors self-start sm:self-auto shrink-0"
              >
                <span>View Request</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Action Loading Banner */}
          {actionLoading && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-2xl flex items-center gap-2.5 animate-fadeIn">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="font-semibold">{actionMessage || 'Processing update...'}</span>
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

          {/* =========================================================================
              VIEW 1: DASHBOARD OVERVIEW (Welcome, Stats, Today's Meal, Shortcuts)
             ========================================================================= */}
          {!loading && !error && mainTab === 'overview' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Hero Banner */}
              <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/10">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-blue-100 mb-3 border border-white/10">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Customer Portal</span>
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      Welcome back, {user?.name?.split(' ')[0] || 'Customer'}! 🍱
                    </h1>
                    <p className="text-sm text-blue-100/90 mt-1.5 max-w-xl">
                      Here is what is cooking for your upcoming meals today and your active tiffin delivery status.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => navigate('/#subscription')}
                      className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-blue-700 font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg transition-all cursor-pointer"
                    >
                      <Utensils className="w-4 h-4 text-blue-600" />
                      <span>Browse Kitchens</span>
                    </button>
                  </div>
                </div>

                {/* Subtle Background Elements */}
                <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              </div>

              {/* Top 3 Live Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Active Subscriptions Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Active Subscriptions
                    </span>
                    <p className="text-3xl font-black text-slate-900 mt-1">
                      {activeSubs.length}
                    </p>
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Delivering daily</span>
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>

                {/* Pending Approval Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Awaiting Kitchen
                    </span>
                    <p className="text-3xl font-black text-amber-600 mt-1">
                      {pendingSubs.length}
                    </p>
                    <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                      {pendingSubs.length > 0 ? 'Under kitchen review' : 'No pending requests'}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>

                {/* Address Book Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Saved Addresses
                    </span>
                    <p className="text-3xl font-black text-slate-900 mt-1">
                      {addresses.length}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleTabSwitch('addresses')}
                      className="text-[11px] text-blue-600 font-bold hover:underline mt-1 block text-left cursor-pointer"
                    >
                      Manage Address Book →
                    </button>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Today's Delivery Highlight Focus Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-blue-600" />
                      <span>Today's Meal Delivery</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Real-time status for your active tiffin meal schedule today.
                    </p>
                  </div>

                  {todaySub && (
                    <button
                      type="button"
                      onClick={() => handleTabSwitch('subscriptions')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                    >
                      <span>View All Plans</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {todaySub ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Meal & Kitchen Details */}
                    <div className="bg-amber-50/60 border border-amber-200/70 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                          <Utensils className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                            Meal Status
                          </span>
                          <span className="text-sm font-extrabold text-slate-900">
                            {todaySub.status === 'PAUSED' ? 'Paused (Deliveries on hold)' : 'Preparing 🍳'}
                          </span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-amber-200/50 text-xs text-slate-700 space-y-1">
                        <p className="font-bold text-slate-900">
                          {todaySub.providerId?.businessName || 'Verified Kitchen'}
                        </p>
                        <p className="text-slate-600">
                          {todaySub.planSnapshot?.name || 'Tiffin Plan'} • {todaySub.planSnapshot?.mealType}
                        </p>
                      </div>
                    </div>

                    {/* Delivery Window */}
                    <div className="bg-blue-50/60 border border-blue-200/70 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                            Delivery Window
                          </span>
                          <span className="text-sm font-extrabold text-blue-900">
                            {todaySub.providerId?.settings?.orderTiming?.lunchDeliveryWindow || '12:00 PM - 01:30 PM'}
                          </span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-blue-200/50 text-xs text-slate-600 space-y-1">
                        <p>Expected arrival at your address between these hours.</p>
                      </div>
                    </div>

                    {/* Delivery Address Snapshot */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Delivering To
                          </span>
                          <span className="text-xs font-bold text-slate-800 block truncate">
                            {todaySub.deliveryAddress?.street || 'Provided Address'}
                          </span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-500 space-y-1 truncate">
                        <p className="truncate">
                          {todaySub.deliveryAddress?.city}{todaySub.deliveryAddress?.postalCode ? ` - ${todaySub.deliveryAddress.postalCode}` : ''}
                        </p>
                        <p className="text-[11px] text-blue-600 font-semibold cursor-pointer" onClick={() => openSubscriptionAddressModal(todaySub)}>
                          Update address for this plan →
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Utensils className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h3 className="text-base font-bold text-slate-800 mb-1">No Active Meals Scheduled Today</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
                      You do not have any active subscriptions delivering today. Explore delicious home-cooked meals from verified kitchens in your neighborhood.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/#subscription')}
                      className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer inline-flex items-center gap-2"
                    >
                      <span>Explore Kitchens & Plans</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <button
                  type="button"
                  onClick={() => handleTabSwitch('subscriptions')}
                  className="p-6 bg-white rounded-3xl border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all text-left group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">My Subscriptions</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    View active and pending meal packages, pause dispatches, or manage renewals.
                  </p>
                  <span className="text-xs font-bold text-blue-600 inline-flex items-center gap-1 mt-4">
                    <span>Manage Plans</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabSwitch('addresses')}
                  className="p-6 bg-white rounded-3xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all text-left group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">Address Book</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Set up Home and Office addresses for fast, auto-filled checkouts on upcoming orders.
                  </p>
                  <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-1 mt-4">
                    <span>Manage Locations</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabSwitch('history')}
                  className="p-6 bg-white rounded-3xl border border-slate-200/80 hover:border-purple-300 hover:shadow-md transition-all text-left group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Package className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">Orders & History</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Review completed subscription cycles, receipts, and past meal histories.
                  </p>
                  <span className="text-xs font-bold text-purple-600 inline-flex items-center gap-1 mt-4">
                    <span>View Archive</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>

            </div>
          )}

          {/* =========================================================================
              VIEW 2: MY SUBSCRIPTIONS (Sub-tabs: Active, Pending Approval, History)
             ========================================================================= */}
          {!loading && !error && mainTab === 'subscriptions' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Header Title Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    My Subscriptions
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Manage your active and pending tiffin subscriptions and track everyday deliveries.
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

              {/* Sub-Tabs: Active (N) | Pending Approval (N) | History (N) */}
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSubFilter('active')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    subFilter === 'active'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  Active ({activeSubs.length})
                </button>

                <button
                  type="button"
                  onClick={() => setSubFilter('pending')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    subFilter === 'pending'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                      : pendingSubs.length > 0
                      ? 'bg-amber-50 text-amber-800 border-2 border-amber-300 hover:bg-amber-100'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span>Pending Approval ({pendingSubs.length})</span>
                  {pendingSubs.length > 0 && (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        subFilter === 'pending' ? 'bg-white' : 'bg-amber-500 animate-pulse'
                      }`}
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSubFilter('history')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    subFilter === 'history'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  History ({historySubs.length})
                </button>
              </div>

              {/* SUB-TAB CONTENT: ACTIVE */}
              {subFilter === 'active' && (
                <>
                  {activeSubs.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto border border-slate-200/80 shadow-md">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                        <Utensils className="w-7 h-7" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">No Active Subscriptions</h3>
                      <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                        You do not have any active meal plans right now. Explore top verified kitchens near you and start your everyday meals.
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
                            className={`bg-white rounded-3xl border shadow-sm hover:shadow-md transition-all overflow-hidden p-6 sm:p-8 space-y-6 ${
                              isPaused ? 'border-amber-200 bg-amber-50/10' : 'border-slate-200/80'
                            }`}
                          >
                            {/* Top Row */}
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                              <div className="flex items-start sm:items-center gap-4">
                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                                  <img
                                    src={bannerImg}
                                    alt={kitchenName}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute top-1.5 left-1.5">
                                    <span
                                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs ${
                                        isPaused
                                          ? 'bg-amber-500 text-white'
                                          : 'bg-emerald-600 text-white'
                                      }`}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                      {isPaused ? 'Paused' : 'Active'}
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <h3 className="text-lg font-bold text-slate-900 leading-tight">
                                    {kitchenName}
                                  </h3>
                                  <p className="text-sm font-semibold text-slate-700">
                                    {planName}
                                  </p>

                                  <div className="flex flex-wrap items-center gap-1.5 text-xs pt-0.5">
                                    <span className="bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1">
                                      <Utensils className="w-3 h-3" />
                                      <span>{mealType}</span>
                                    </span>
                                    <span className="bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-md text-[11px]">
                                      {diet === 'NON_VEG' ? 'Non-Veg' : 'Veg'}
                                    </span>
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[11px]">
                                      All Days
                                    </span>
                                    <span className="text-slate-900 font-extrabold text-sm ml-1">
                                      ₹{price.toLocaleString()} <span className="text-xs font-normal text-slate-500">/{durationDays} days</span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="lg:w-72 space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold">
                                  <span className="text-slate-700">Day {daysCompleted} of {durationDays}</span>
                                  <span className="text-blue-600 font-extrabold">{progressPercent}%</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-0.5">
                                  <span>Start: {formatDate(sub.startDate)}</span>
                                  <span>End: {formatDate(sub.endDate)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Middle Action Buttons */}
                            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {isPaused ? (
                                  <button
                                    type="button"
                                    onClick={() => handleResume(sub._id)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs cursor-pointer"
                                  >
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    <span>Resume Deliveries</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handlePause(sub._id)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-all cursor-pointer"
                                  >
                                    <Pause className="w-3.5 h-3.5" />
                                    <span>Pause Subscription</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => openSubscriptionAddressModal(sub)}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-all cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Update Address</span>
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => setCancellingSub(sub)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 font-semibold transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Cancel Subscription</span>
                              </button>
                            </div>

                            {/* Bottom 3 Information Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                              {/* Col 1: Today's Meal */}
                              <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                  <Utensils className="w-5 h-5" />
                                </div>
                                <div className="overflow-hidden">
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                                    Today's Meal
                                  </span>
                                  <span className="text-xs font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md inline-block mt-0.5">
                                    {isPaused ? 'Paused' : 'Preparing'}
                                  </span>
                                  <p className="text-[11px] text-slate-500 mt-1 truncate">
                                    Expected: {sub.providerId?.settings?.orderTiming?.lunchDeliveryWindow || '12:00 PM - 01:30 PM'}
                                  </p>
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
                                    {sub.deliveryAddress?.street || 'No street specified'}
                                  </p>
                                  <p className="text-[11px] text-slate-500 truncate">
                                    {sub.deliveryAddress?.city} {sub.deliveryAddress?.landmark ? `• ${sub.deliveryAddress.landmark}` : ''}
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

              {/* SUB-TAB CONTENT: PENDING APPROVAL */}
              {subFilter === 'pending' && (
                <>
                  {pendingSubs.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto border border-slate-200/80 shadow-md">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-7 h-7" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">No Pending Requests</h3>
                      <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                        You do not have any subscription requests awaiting kitchen review right now.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSubFilter('active')}
                        className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md cursor-pointer inline-flex items-center gap-2"
                      >
                        <span>View Active Subscriptions</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {pendingSubs.map((sub) => {
                        const durationDays = sub.planSnapshot?.durationDays || 30;
                        const kitchenName = sub.providerId?.businessName || 'Verified Kitchen';
                        const planName = sub.planSnapshot?.name || 'Tiffin Plan';
                        const mealType = sub.planSnapshot?.mealType || 'LUNCH';
                        const diet = sub.planSnapshot?.diet || 'VEG';
                        const price = sub.totalAmount || 1499;

                        const bannerImg =
                          sub.providerId?.imageUrl ||
                          'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80';

                        return (
                          <div
                            key={sub._id}
                            className="bg-white rounded-3xl border-2 border-amber-300 shadow-sm hover:shadow-md transition-all overflow-hidden p-6 sm:p-8 space-y-6 animate-fadeIn"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                              <div className="flex items-start sm:items-center gap-4">
                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                                  <img
                                    src={bannerImg}
                                    alt={kitchenName}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute top-1.5 left-1.5">
                                    <span className="bg-amber-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                      Pending Review
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <h3 className="text-lg font-bold text-slate-900 leading-tight">
                                    {kitchenName}
                                  </h3>
                                  <p className="text-sm font-semibold text-slate-700">
                                    {planName}
                                  </p>

                                  <div className="flex flex-wrap items-center gap-1.5 text-xs pt-0.5">
                                    <span className="bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1">
                                      <Utensils className="w-3 h-3" />
                                      <span>{mealType}</span>
                                    </span>
                                    <span className="bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-md text-[11px]">
                                      {diet === 'NON_VEG' ? 'Non-Veg' : 'Pure Veg'}
                                    </span>
                                    <span className="bg-slate-100 text-slate-700 font-extrabold px-2 py-0.5 rounded-md text-[11px]">
                                      ₹{price.toLocaleString()}
                                    </span>
                                    <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md text-[10px]">
                                      {durationDays} Days Plan
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 max-w-md text-xs text-amber-950 space-y-1">
                                <div className="flex items-center gap-2 font-bold text-amber-950">
                                  <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                                  <span>Awaiting Kitchen Confirmation</span>
                                </div>
                                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                                  This kitchen manually confirms each new subscription based on daily preparation capacity. Deliveries will start on <strong>{formatDate(sub.startDate)}</strong> once approved.
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs">
                              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                                  Requested Delivery Schedule
                                </span>
                                <p className="font-bold text-slate-800">
                                  {formatDate(sub.startDate)} — {formatDate(sub.endDate)}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Duration: {durationDays} Days ({mealType})
                                </p>
                              </div>

                              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                                  Delivery Location
                                </span>
                                <p className="font-bold text-slate-800 truncate">
                                  {sub.deliveryAddress?.street}, {sub.deliveryAddress?.city}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Contact: {sub.deliveryAddress?.contactPhone || 'Provided Phone'}
                                </p>
                              </div>

                              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-1">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 block">
                                  Approval Status
                                </span>
                                <p className="font-extrabold text-amber-700 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                  <span>Waiting for Kitchen Acceptance</span>
                                </p>
                                <p className="text-[11px] text-amber-900/80">
                                  Auto-checking for provider approval...
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* SUB-TAB CONTENT: HISTORY */}
              {subFilter === 'history' && (
                <div className="space-y-6">
                  {historySubs.length === 0 ? (
                    <div className="bg-white rounded-3xl p-10 text-center max-w-md mx-auto border border-slate-200/80">
                      <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <h3 className="text-base font-bold text-slate-900">No Past History</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Completed, expired, or cancelled subscriptions will be archived here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {historySubs.map((sub) => (
                        <div
                          key={sub._id}
                          className="bg-white rounded-2xl p-5 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">
                                {sub.providerId?.businessName || 'Kitchen'}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                sub.status === 'EXPIRED' ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-600'
                              }`}>
                                {sub.status}
                              </span>
                            </div>
                            <p className="text-slate-600">
                              {sub.planSnapshot?.name} • {sub.planSnapshot?.mealType} • ₹{sub.totalAmount}
                            </p>
                            <p className="text-slate-400 text-[11px]">
                              Period: {formatDate(sub.startDate)} – {formatDate(sub.endDate)}
                            </p>
                            {sub.notes && (
                              <p className="text-slate-500 italic text-[11px]">
                                Note: {sub.notes}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => navigate('/#subscription')}
                            className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 cursor-pointer self-start sm:self-auto"
                          >
                            Re-subscribe
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* =========================================================================
              VIEW 3: ADDRESS BOOK MANAGEMENT VIEW
             ========================================================================= */}
          {!loading && !error && mainTab === 'addresses' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Address Book
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Manage your delivery locations. Your default address will automatically auto-fill whenever you subscribe to a meal plan.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddAddressModal}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Address</span>
                </button>
              </div>

              {/* Address Cards Grid */}
              {loadingAddresses ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
                  <div className="h-44 bg-slate-200/70 rounded-3xl" />
                  <div className="h-44 bg-slate-200/70 rounded-3xl" />
                </div>
              ) : addresses.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto border border-slate-200/80 shadow-md">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No Saved Addresses Yet</h3>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    Save your home or office address once, and it will automatically pre-fill for all your upcoming meal subscriptions!
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddAddressModal}
                    className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 cursor-pointer inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Your First Address</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {addresses.map((addr) => {
                    const isDefault = Boolean(addr.isDefault);
                    const matchingActivePlans = activeSubs.filter(
                      (s) =>
                        s.deliveryAddress?.street?.toLowerCase() === addr.street?.toLowerCase() &&
                        s.deliveryAddress?.city?.toLowerCase() === addr.city?.toLowerCase()
                    );

                    return (
                      <div
                        key={addr._id}
                        className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between gap-5 relative shadow-xs hover:shadow-md ${
                          isDefault ? 'border-blue-300 ring-2 ring-blue-500/10' : 'border-slate-200/80'
                        }`}
                      >
                        {/* Top Label & Actions */}
                        <div>
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                addr.label === 'Home'
                                  ? 'bg-blue-50 text-blue-600'
                                  : addr.label === 'Office'
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-emerald-50 text-emerald-600'
                              }`}>
                                {addr.label === 'Home' ? (
                                  <Home className="w-4 h-4" />
                                ) : addr.label === 'Office' ? (
                                  <Building2 className="w-4 h-4" />
                                ) : (
                                  <MapPin className="w-4 h-4" />
                                )}
                              </div>
                              <h3 className="font-extrabold text-slate-900 text-sm">
                                {addr.label || 'Saved Location'}
                              </h3>
                            </div>

                            {isDefault ? (
                              <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Default Address</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetDefaultAddressBookEntry(addr._id)}
                                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                              >
                                Set as Default
                              </button>
                            )}
                          </div>

                          {/* Address Details */}
                          <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                            <p className="font-bold text-slate-800 leading-snug">
                              {addr.street}
                            </p>
                            <p className="text-slate-500">
                              {addr.city} {addr.postalCode ? `— ${addr.postalCode}` : ''}
                            </p>
                            {addr.landmark && (
                              <p className="text-slate-400 text-[11px]">
                                Landmark: {addr.landmark}
                              </p>
                            )}
                            {addr.contactPhone && (
                              <p className="text-slate-500 font-medium pt-1">
                                Phone: {addr.contactPhone}
                              </p>
                            )}
                          </div>

                          {/* Matching Active Subscriptions info */}
                          {matchingActivePlans.length > 0 && (
                            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-blue-700 font-semibold bg-blue-50/60 px-3 py-1.5 rounded-xl">
                              <Utensils className="w-3.5 h-3.5 text-blue-600" />
                              <span>Delivering {matchingActivePlans.length} active meal {matchingActivePlans.length === 1 ? 'plan' : 'plans'} here</span>
                            </div>
                          )}
                        </div>

                        {/* Bottom Buttons: Edit / Delete */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => handleOpenEditAddressModal(addr)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteAddressBookEntry(addr._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 font-semibold cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* =========================================================================
              VIEW 4: ORDERS & HISTORY
             ========================================================================= */}
          {!loading && !error && mainTab === 'history' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Orders & Subscription History
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Complete record of your past completed, renewed, or cancelled tiffin meal subscriptions.
                </p>
              </div>

              {historySubs.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto border border-slate-200/80 shadow-md">
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4">
                    <Package className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No Past Subscriptions</h3>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    Whenever a subscription expires or finishes its duration, its complete history will be safely stored here for easy re-ordering.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/#subscription')}
                    className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>Browse Meal Plans</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {historySubs.map((sub) => (
                    <div
                      key={sub._id}
                      className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">
                            {sub.providerId?.businessName || 'Kitchen'}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.status === 'EXPIRED' ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-600 border border-red-200'
                          }`}>
                            {sub.status}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-700">
                          {sub.planSnapshot?.name} • {sub.planSnapshot?.mealType} • ₹{sub.totalAmount}
                        </p>
                        <p className="text-slate-400 text-[11px]">
                          Duration: {formatDate(sub.startDate)} – {formatDate(sub.endDate)}
                        </p>
                        {sub.notes && (
                          <p className="text-slate-500 italic text-[11px] pt-1">
                            Note: {sub.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => navigate('/#subscription')}
                          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors shadow-xs"
                        >
                          Re-Subscribe
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </main>
      </div>

      {/* ================= MODAL: ADD / EDIT ADDRESS BOOK ENTRY ================= */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="fixed inset-0 -z-10" onClick={() => !actionLoading && setAddressModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 my-auto text-left animate-scaleUp">
            
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Save to your Address Book for instant checkout
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddressModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddressBookEntry} className="space-y-4">
              
              {/* Address Label Choice */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Address Type / Label
                </label>
                <div className="flex items-center gap-2">
                  {['Home', 'Office', 'Other'].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setAddressFormData({ ...addressFormData, label: lbl })}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                        addressFormData.label === lbl
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {lbl === 'Home' ? <Home className="w-3.5 h-3.5" /> : lbl === 'Office' ? <Building2 className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                      <span>{lbl}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Street */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="House / Flat No., Building, Area, Street Name"
                  value={addressFormData.street}
                  onChange={(e) => setAddressFormData({ ...addressFormData, street: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* City & Pincode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ahmedabad"
                    value={addressFormData.city}
                    onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    placeholder="380009"
                    value={addressFormData.postalCode}
                    onChange={(e) => setAddressFormData({ ...addressFormData, postalCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Landmark */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Metro Station / Behind Mall"
                  value={addressFormData.landmark}
                  onChange={(e) => setAddressFormData({ ...addressFormData, landmark: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={addressFormData.contactPhone}
                  onChange={(e) => setAddressFormData({ ...addressFormData, contactPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Set as Default checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={addressFormData.isDefault}
                    onChange={(e) => setAddressFormData({ ...addressFormData, isDefault: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                  <span>Set as my default address for new meal subscriptions</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : editingAddress ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: UPDATE SUBSCRIPTION ADDRESS ================= */}
      {updatingAddressSub && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="fixed inset-0 -z-10" onClick={() => !actionLoading && setUpdatingAddressSub(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 my-auto text-left animate-scaleUp">
            
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Change Delivery Address</h3>
                  <p className="text-xs text-slate-500">
                    For {updatingAddressSub.planSnapshot?.name || 'Meal Plan'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUpdatingAddressSub(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Picker from Address Book */}
            {addresses.length > 0 && (
              <div className="mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-600 block mb-2">
                  Pick from saved addresses:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {addresses.map((savedAddr) => (
                    <button
                      key={savedAddr._id}
                      type="button"
                      onClick={() => {
                        setSubAddressForm({
                          street: savedAddr.street || '',
                          city: savedAddr.city || '',
                          postalCode: savedAddr.postalCode || '',
                          landmark: savedAddr.landmark || '',
                          contactPhone: savedAddr.contactPhone || user?.phone || '',
                          notes: subAddressForm.notes || '',
                        });
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>{savedAddr.label === 'Home' ? '🏠' : savedAddr.label === 'Office' ? '🏢' : '📍'}</span>
                      <span>{savedAddr.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveSubscriptionAddress} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={subAddressForm.street}
                  onChange={(e) => setSubAddressForm({ ...subAddressForm, street: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={subAddressForm.city}
                    onChange={(e) => setSubAddressForm({ ...subAddressForm, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    value={subAddressForm.postalCode}
                    onChange={(e) => setSubAddressForm({ ...subAddressForm, postalCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={subAddressForm.landmark}
                  onChange={(e) => setSubAddressForm({ ...subAddressForm, landmark: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  required
                  value={subAddressForm.contactPhone}
                  onChange={(e) => setSubAddressForm({ ...subAddressForm, contactPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Notes</label>
                <textarea
                  rows={2}
                  value={subAddressForm.notes}
                  onChange={(e) => setSubAddressForm({ ...subAddressForm, notes: e.target.value })}
                  placeholder="e.g. Leave with security desk"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setUpdatingAddressSub(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
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
          <div className="fixed inset-0 -z-10" onClick={() => !actionLoading && setCancellingSub(null)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 my-auto text-left animate-scaleUp">
            
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">Cancel Subscription</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {cancellingSub.planSnapshot?.name || 'Meal Plan'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to cancel your meal subscription? Upcoming daily meal dispatches will stop immediately.
            </p>

            <form onSubmit={handleCancel} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Reason for Cancellation <span className="text-red-500">*</span>
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  disabled={actionLoading}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none cursor-pointer"
                >
                  {CUSTOMER_CANCEL_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {cancelReason === "Other reason (please specify)" ? (
                    <>Specify Reason <span className="text-red-500">*</span></>
                  ) : (
                    <>Additional Feedback <span className="text-slate-400 font-normal">(Optional)</span></>
                  )}
                </label>
                <textarea
                  rows={2}
                  value={cancelNote}
                  onChange={(e) => setCancelNote(e.target.value)}
                  disabled={actionLoading}
                  placeholder={
                    cancelReason === "Other reason (please specify)"
                      ? "Please tell us why you are cancelling..."
                      : "Help the kitchen improve by sharing your feedback..."
                  }
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Notice:</strong> Your daily meal dispatches will stop immediately. Any unconsumed meal credits will remain documented in your profile.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingSub(null)}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  Keep Subscription
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-500/20 disabled:opacity-50 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{actionLoading ? 'Cancelling...' : 'Confirm Cancel'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
