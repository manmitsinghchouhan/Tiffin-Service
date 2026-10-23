import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  ArrowRight,
  ChevronRight,
  Clock,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import api from '../../services/api';

export default function RecentOrders({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const avatarColors = [
    'bg-blue-100 text-blue-700 border border-blue-200/60',
    'bg-emerald-100 text-emerald-700 border border-emerald-200/60',
    'bg-purple-100 text-purple-700 border border-purple-200/60',
    'bg-amber-100 text-amber-700 border border-amber-200/60',
  ];

  const getInitials = (name) => {
    if (!name) return 'CU';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  useEffect(() => {
    let isMounted = true;
    const fetchRecentOrders = async () => {
      try {
        setLoading(true);
        const res = await api.get('/provider/orders', {
          params: { limit: 4 },
        });
        if (isMounted && res.data?.success && res.data?.data) {
          setOrders(res.data.data);
        }
      } catch (err) {
        console.warn('Failed to load recent orders for overview:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRecentOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  const getStatusBadge = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    switch (s) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Pending
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
            <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
            Accepted
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
            <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const handleRowClick = () => {
    if (onNavigate) {
      onNavigate('orders');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 shadow-xs">
            <ClipboardList className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">Recent Orders</h2>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate('orders')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors group cursor-pointer"
        >
          <span>View all orders</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto mt-2 -mx-6 px-6">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Loading recent orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No customer orders received yet. Active subscriber bookings will appear here.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">ORDER</th>
                <th className="py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">CUSTOMER</th>
                <th className="py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">MEAL / PLAN</th>
                <th className="py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">AMOUNT</th>
                <th className="py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">STATUS</th>
                <th className="py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">DATE</th>
                <th className="py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order, idx) => {
                const cust = order.customerId || {};
                const plan = order.planSnapshot || order.planId || {};
                const orderCode = order.orderCode || `#ORD-${order._id?.slice(-6).toUpperCase()}`;
                const avatarColor = avatarColors[idx % avatarColors.length];

                return (
                  <tr
                    key={order._id}
                    onClick={handleRowClick}
                    className="group hover:bg-slate-50/70 cursor-pointer transition-colors"
                  >
                    {/* Order ID */}
                    <td className="py-3.5 text-xs font-semibold text-slate-600 group-hover:text-blue-600 transition-colors">
                      {orderCode}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shadow-2xs ${avatarColor}`}>
                          {getInitials(cust.name)}
                        </div>
                        <span className="text-xs font-medium text-slate-800">
                          {cust.name || 'Customer'}
                        </span>
                      </div>
                    </td>

                    {/* Meal / Plan */}
                    <td className="py-3.5 text-xs text-slate-600 font-medium truncate max-w-[150px]">
                      {plan.name || 'Tiffin Plan'}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 text-xs font-bold text-slate-900">
                      ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5">
                      {getStatusBadge(order.status)}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 text-xs text-slate-500 font-medium whitespace-nowrap">
                      {formatDate(order.orderDate || order.createdAt)}
                    </td>

                    {/* Arrow */}
                    <td className="py-3.5 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all inline-block" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
