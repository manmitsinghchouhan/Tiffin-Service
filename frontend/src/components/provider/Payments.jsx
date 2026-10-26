import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Utensils
} from 'lucide-react';
import api from '../../services/api';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function Payments({ onToast }) {
  const [payments, setPayments] = useState([]);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    averageOrderValue: 0,
    successRate: 100,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPayments = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await api.get('/provider/payments');
      if (res.data?.success) {
        setPayments(res.data.data || []);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      }
    } catch (err) {
      console.error('Failed to fetch provider payments:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load payments data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Filtered transactions by search query
  const filteredPayments = payments.filter((p) => {
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const customerName = p.customerId?.name?.toLowerCase() || '';
      const customerPhone = p.customerId?.phone?.toLowerCase() || '';
      const txnId = p.transactionId?.toLowerCase() || '';
      const planName = p.subscriptionId?.planSnapshot?.name?.toLowerCase() || '';
      if (
        !customerName.includes(q) &&
        !customerPhone.includes(q) &&
        !txnId.includes(q) &&
        !planName.includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Headline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Payments & Earnings</span>
            <span className="text-2xl">💳</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Track customer subscriptions checkout payments, revenue analytics, and transaction records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchPayments(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-700 shadow-xs transition-all cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* 4 Clean, Accurate Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Revenue */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Total Revenue
            </span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              ₹{metrics.totalRevenue.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{metrics.totalTransactions} paid transactions</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <IndianRupee className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 2: Paid Subscriptions */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Paid Subscriptions
            </span>
            <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">
              {metrics.totalTransactions}
            </p>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
              Active meal subscriptions
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 3: Average Order Value */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Avg. Plan Value
            </span>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
              ₹{metrics.averageOrderValue.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
              Average per subscription
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 4: Success Rate */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Success Rate
            </span>
            <p className="text-2xl sm:text-3xl font-black text-purple-600 mt-1">
              {metrics.successRate}%
            </p>
            <span className="text-[11px] text-purple-700 font-medium mt-1 block">
              Direct confirmed checkout
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* Main Content Box: Search & Transactions Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Active Tab Badge */}
          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-xs flex items-center gap-1.5">
              <span>All Paid Transactions</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white">
                {payments.length}
              </span>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Showing verified subscription payments
            </span>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search customer, phone, plan, txn ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-500">Loading payment transactions...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8 text-center text-red-600 text-xs">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
            <p>{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredPayments.length === 0 && (
          <div className="p-12 text-center max-w-sm mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No Transactions Found</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchTerm
                ? 'No transactions match your search filter.'
                : 'Whenever customers subscribe to your tiffin meal plans, payments will automatically appear here.'}
            </p>
          </div>
        )}

        {/* Transactions Table */}
        {!loading && !error && filteredPayments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3 px-5">Customer</th>
                  <th className="py-3 px-4">Plan / Meal Details</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Transaction ID & Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => {
                  const customerName = p.customerId?.name || 'Customer';
                  const customerPhone = p.customerId?.phone || '';
                  const planName = p.subscriptionId?.planSnapshot?.name || 'Tiffin Meal Plan';
                  const mealType = p.subscriptionId?.planSnapshot?.mealType || 'Meal';
                  const duration = p.subscriptionId?.planSnapshot?.durationDays
                    ? `${p.subscriptionId.planSnapshot.durationDays} Days`
                    : '';

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Customer */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
                            {customerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {customerName}
                            </span>
                            {customerPhone && (
                              <span className="text-[11px] text-slate-400 block mt-0.5">
                                {customerPhone}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Plan / Meal Details */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-semibold text-slate-800 block truncate max-w-[220px]">
                            {planName}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {mealType.replace('_', ' ')} {duration ? `• ${duration}` : ''}
                          </span>
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                          <CreditCard className="w-3 h-3" />
                          <span>Direct Payment</span>
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                        ₹{(p.amount || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>PAID / CONFIRMED</span>
                        </span>
                      </td>

                      {/* Transaction ID & Date */}
                      <td className="py-3.5 px-5 text-right font-mono text-[11px] text-slate-500">
                        <span className="block truncate font-semibold text-slate-700">
                          {p.transactionId || '—'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                          {formatDate(p.paymentDate || p.createdAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
