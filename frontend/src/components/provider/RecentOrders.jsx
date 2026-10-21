import React from 'react';
import {
  ClipboardList,
  ArrowRight,
  ChevronRight,
  Clock,
  CheckCircle,
  CreditCard
} from 'lucide-react';

export default function RecentOrders({ onNavigate }) {
  const recentOrders = [
    {
      id: '#ORD1003',
      customer: {
        name: 'Aarav Patel',
        initials: 'AP',
        bg: 'bg-blue-100 text-blue-700 border border-blue-200/60',
      },
      mealPlan: 'Lunch (One-time)',
      amount: '₹120',
      status: 'Pending',
      statusType: 'pending',
      date: '14 Oct 2026',
    },
    {
      id: '#ORD1002',
      customer: {
        name: 'Neha Shah',
        initials: 'NS',
        bg: 'bg-emerald-100 text-emerald-700 border border-emerald-200/60',
      },
      mealPlan: 'Dinner (One-time)',
      amount: '₹150',
      status: 'Accepted',
      statusType: 'accepted',
      date: '14 Oct 2026',
    },
    {
      id: '#ORD1001',
      customer: {
        name: 'Rohan Mehta',
        initials: 'RM',
        bg: 'bg-purple-100 text-purple-700 border border-purple-200/60',
      },
      mealPlan: 'Weekly Veg Plan',
      amount: '₹1,499',
      status: 'Paid',
      statusType: 'paid',
      date: '13 Oct 2026',
    },
  ];

  const getStatusBadge = (status, type) => {
    switch (type) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            {status}
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
            <CheckCircle className="w-3 h-3 stroke-[2.5]" />
            {status}
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
            <CreditCard className="w-3 h-3 stroke-[2.5]" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors group"
        >
          <span>View all orders</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto mt-2 -mx-6 px-6">
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
            {recentOrders.map((order) => (
              <tr
                key={order.id}
                onClick={handleRowClick}
                className="group hover:bg-slate-50/70 cursor-pointer transition-colors"
              >
                {/* Order ID */}
                <td className="py-3.5 text-xs font-semibold text-slate-600 group-hover:text-blue-600 transition-colors">
                  {order.id}
                </td>

                {/* Customer */}
                <td className="py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shadow-2xs ${order.customer.bg}`}>
                      {order.customer.initials}
                    </div>
                    <span className="text-xs font-medium text-slate-800">
                      {order.customer.name}
                    </span>
                  </div>
                </td>

                {/* Meal / Plan */}
                <td className="py-3.5 text-xs text-slate-600 font-medium">
                  {order.mealPlan}
                </td>

                {/* Amount */}
                <td className="py-3.5 text-xs font-bold text-slate-900">
                  {order.amount}
                </td>

                {/* Status Badge */}
                <td className="py-3.5">
                  {getStatusBadge(order.status, order.statusType)}
                </td>

                {/* Date */}
                <td className="py-3.5 text-xs text-slate-500 font-medium whitespace-nowrap">
                  {order.date}
                </td>

                {/* Arrow */}
                <td className="py-3.5 text-right">
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all inline-block" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
