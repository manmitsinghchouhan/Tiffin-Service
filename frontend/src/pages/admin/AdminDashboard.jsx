import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  UtensilsCrossed,
  ChefHat,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setError('');
      const { data } = await api.get('/admin/stats');
      if (data.success && data.data) {
        setStats(data.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load dashboard metrics. Please check server status.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const summary = stats?.summary;
  const recentApplications = stats?.recentActivity?.applications || [];
  const recentUsers = stats?.recentActivity?.users || [];

  return (
    <AdminLayout activePage="dashboard">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time platform metrics, incoming kitchen applications, and account activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Stats'}</span>
          </button>

          <Link
            to="/admin/providers?status=PENDING"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Manage Approvals</span>
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-xs font-medium text-slate-400">Loading platform statistics...</span>
        </div>
      ) : (
        <>
          {/* 4 Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {/* Card 1: Pending Approvals */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  Pending Review
                </span>
              </div>
              <div className="text-3xl font-extrabold text-white mb-1">
                {summary?.providers?.pending ?? 0}
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Kitchen applications awaiting verification
              </p>
              <Link
                to="/admin/providers?status=PENDING"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
              >
                <span>Review Applications</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 2: Verified Kitchens */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <ChefHat className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Active
                </span>
              </div>
              <div className="text-3xl font-extrabold text-white mb-1">
                {summary?.providers?.verified ?? 0}
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Verified tiffin provider kitchens
              </p>
              <span className="text-xs text-slate-500 block">
                Total profiles submitted: <strong>{summary?.providers?.totalProfiles ?? 0}</strong>
              </span>
            </div>

            {/* Card 3: Platform Users */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl hover:border-blue-500/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                  Total Users
                </span>
              </div>
              <div className="text-3xl font-extrabold text-white mb-1">
                {(summary?.customers?.total ?? 0) + (summary?.providers?.totalUsers ?? 0)}
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Registered platform accounts
              </p>
              <span className="text-xs text-slate-500 block">
                {summary?.customers?.total ?? 0} Customers • {summary?.providers?.totalUsers ?? 0} Providers
              </span>
            </div>

            {/* Card 4: Orders & Revenue */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl hover:border-indigo-500/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                  Revenue
                </span>
              </div>
              <div className="text-3xl font-extrabold text-white mb-1">
                ₹{summary?.business?.totalRevenue?.toLocaleString('en-IN') ?? 0}
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Total gross order volume
              </p>
              <span className="text-xs text-slate-500 block">
                {summary?.business?.totalOrders ?? 0} Orders • {summary?.business?.totalSubscriptions ?? 0} Subscriptions
              </span>
            </div>
          </div>

          {/* Dual Activity Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Panel 1: Recent Kitchen Applications (2 Columns) */}
            <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Recent Kitchen Applications</h3>
                    <p className="text-xs text-slate-400">Incoming provider onboarding requests</p>
                  </div>
                </div>
                <Link
                  to="/admin/providers"
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentApplications.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No provider applications submitted yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentApplications.map((app) => (
                    <div
                      key={app._id}
                      className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800/80 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-start gap-3.5">
                        {app.imageUrl ? (
                          <img
                            src={app.imageUrl}
                            alt={app.businessName}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700 shrink-0">
                            <Building2 className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{app.businessName}</h4>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                app.verificationStatus === 'VERIFIED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : app.verificationStatus === 'REJECTED'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {app.verificationStatus}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                            <span>Owner: <strong>{app.userId?.name || 'Partner'}</strong></span>
                            <span>•</span>
                            <span>{app.city}</span>
                            <span>•</span>
                            <span className="text-[11px] font-medium text-slate-500">
                              {app.foodType === 'VEG' ? 'Pure Veg' : app.foodType === 'NON_VEG' ? 'Non-Veg' : 'Veg & Non-Veg'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Link
                          to={`/admin/providers?search=${encodeURIComponent(app.businessName)}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Panel 2: Recent User Registrations (1 Column) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Recent Users</h3>
                    <p className="text-xs text-slate-400">Newly registered accounts</p>
                  </div>
                </div>
              </div>

              {recentUsers.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No recent registrations.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {recentUsers.map((u) => (
                    <div
                      key={u._id}
                      className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800/80 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">{u.name}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                              u.role === 'PROVIDER'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : u.role === 'ADMIN'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}
                          >
                            {u.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">{u.email}</div>
                      </div>

                      <div className="text-[10px] text-slate-500 shrink-0">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recent'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
