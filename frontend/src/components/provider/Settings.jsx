import React, { useState, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  Clock,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const CUTOFF_OPTIONS_LUNCH = [
  '08:30 AM',
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
];

const CUTOFF_OPTIONS_DINNER = [
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
  '05:30 PM',
  '06:00 PM',
];

const DELIVERY_WINDOWS_LUNCH = [
  '11:30 AM - 01:00 PM',
  '12:00 PM - 01:30 PM',
  '12:30 PM - 02:00 PM',
  '01:00 PM - 02:30 PM',
];

const DELIVERY_WINDOWS_DINNER = [
  '07:00 PM - 08:30 PM',
  '07:30 PM - 09:00 PM',
  '08:00 PM - 09:30 PM',
  '08:30 PM - 10:00 PM',
];

export default function Settings({ onToast, onNavigateToProfile }) {
  const { user, providerProfile, logoutProvider } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState('timing'); // 'timing' | 'security'
  const [fetching, setFetching] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Settings State - Operational Timings
  const [orderTiming, setOrderTiming] = useState({
    lunchCutoff: '09:30 AM',
    dinnerCutoff: '04:30 PM',
    lunchDeliveryWindow: '12:00 PM - 01:30 PM',
    dinnerDeliveryWindow: '07:30 PM - 09:00 PM',
    autoAcceptOrders: true,
  });

  // Password Change Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  // Load existing settings from server
  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      setFetching(true);
      try {
        const res = await api.get('/provider/settings');
        if (isMounted && res.data?.success && res.data?.data?.settings) {
          const s = res.data.data.settings;
          if (s.orderTiming) setOrderTiming(s.orderTiming);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        if (isMounted) setFetching(false);
      }
    };

    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save Settings Preferences
  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSavingSettings(true);
    try {
      const payload = {
        orderTiming,
      };

      const res = await api.put('/provider/settings', payload);
      if (res.data?.success) {
        onToast?.('Operational timing settings updated successfully!');
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
      onToast?.(err.message || 'Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Change Password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!passwordForm.currentPassword) {
      setPasswordError('Please enter your current account password');
      return;
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.put('/provider/settings/password', passwordForm);
      if (res.data?.success) {
        setPasswordSuccess('Password changed successfully! Keep it confidential.');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        onToast?.('Password updated successfully!');
      }
    } catch (err) {
      console.error('Password change error:', err);
      setPasswordError(err.message || 'Failed to update password. Verify current password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const navTabs = [
    { id: 'timing', label: 'Operational Timings', icon: Clock },
    { id: 'security', label: 'Account & Security', icon: Shield },
  ];

  if (fetching) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-9 h-9 text-blue-600 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500">
          Loading kitchen and security settings...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-12 animate-in fade-in duration-200">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight">
              Settings
            </h1>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              Kitchen Operations
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Manage daily order cutoff timings, dispatch windows, and account security.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-semibold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
          >
            {savingSettings ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}

      {/* ================= TAB 1: OPERATIONAL TIMINGS ================= */}
      {activeSubTab === 'timing' && (
        <div className="space-y-6">
          {/* Daily Cutoff Deadlines */}
          <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Order Cutoff Deadlines</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Orders or subscription meal modifications placed after these hours roll over to the following dispatch
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lunch Cutoff */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lunch Order Cutoff Time
                </label>
                <select
                  value={orderTiming.lunchCutoff}
                  onChange={(e) =>
                    setOrderTiming({ ...orderTiming, lunchCutoff: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {CUTOFF_OPTIONS_LUNCH.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt} (Daily Lunch Cutoff)
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Kitchen staff begin packaging rotis & rice immediately after this time.
                </span>
              </div>

              {/* Dinner Cutoff */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Dinner Order Cutoff Time
                </label>
                <select
                  value={orderTiming.dinnerCutoff}
                  onChange={(e) =>
                    setOrderTiming({ ...orderTiming, dinnerCutoff: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {CUTOFF_OPTIONS_DINNER.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt} (Daily Dinner Cutoff)
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Evening prep tally freezes at this exact time.
                </span>
              </div>
            </div>
          </section>

          {/* Delivery Timeslots */}
          <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Customer Delivery Windows</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                The expected delivery timeslots showcased to office subscribers and home customers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lunch Delivery Window */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lunch Delivery Timeslot
                </label>
                <select
                  value={orderTiming.lunchDeliveryWindow}
                  onChange={(e) =>
                    setOrderTiming({
                      ...orderTiming,
                      lunchDeliveryWindow: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {DELIVERY_WINDOWS_LUNCH.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dinner Delivery Window */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Dinner Delivery Timeslot
                </label>
                <select
                  value={orderTiming.dinnerDeliveryWindow}
                  onChange={(e) =>
                    setOrderTiming({
                      ...orderTiming,
                      dinnerDeliveryWindow: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {DELIVERY_WINDOWS_DINNER.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Auto Accept Switch */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Instant Auto-Accept Incoming Commercial Orders
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 max-w-lg">
                  Automatically set new online orders to "ACCEPTED" without requiring manual click on the order ledger.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOrderTiming({
                    ...orderTiming,
                    autoAcceptOrders: !orderTiming.autoAcceptOrders,
                  })
                }
                className={`relative inline-flex h-7 w-13 items-center rounded-full transition-colors cursor-pointer ${
                  orderTiming.autoAcceptOrders ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                    orderTiming.autoAcceptOrders ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ================= TAB 4: ACCOUNT & SECURITY ================= */}
      {activeSubTab === 'security' && (
        <div className="space-y-6">
          {/* Owner Account Card */}
          <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>Verified Owner Account</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Your primary authentication credentials for this kitchen
                </p>
              </div>

              <button
                type="button"
                onClick={onNavigateToProfile}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Edit Public Business Profile</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Owner Name
                </span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
                  {user?.name || 'Kitchen Partner'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Registered Email
                </span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
                  {user?.email || 'provider@test.com'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Registered Phone
                </span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
                  {user?.phone || '+91 98765 43210'}
                </span>
              </div>
            </div>
          </section>

          {/* Change Password Form */}
          <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <span>Change Account Password</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ensure your kitchen management account uses a strong, secure password
              </p>
            </div>

            {passwordError && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                    }
                    placeholder="Enter existing password"
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        current: !showPasswords.current,
                      })
                    }
                    className="text-slate-400 hover:text-slate-600 absolute right-3.5 top-3"
                  >
                    {showPasswords.current ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    placeholder="Minimum 6 characters"
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                    }
                    className="text-slate-400 hover:text-slate-600 absolute right-3.5 top-3"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Repeat new password"
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        confirm: !showPasswords.confirm,
                      })
                    }
                    className="text-slate-400 hover:text-slate-600 absolute right-3.5 top-3"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-semibold shadow-sm transition-all cursor-pointer mt-2"
              >
                {savingPassword ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
                <span>{savingPassword ? 'Updating...' : 'Update Password'}</span>
              </button>
            </form>
          </section>

          {/* Session & Sign Out Card */}
          <section className="bg-white rounded-3xl border border-red-100 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-red-600">Sign Out of Kitchen Session</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Securely clear active HTTP session cookies and return to partner sign-in screen
              </p>
            </div>

            <button
              type="button"
              onClick={logoutProvider}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold border border-red-200 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
