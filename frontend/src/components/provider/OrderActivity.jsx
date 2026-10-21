import React, { useState } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  CheckCircle2,
  PackageCheck,
  ChevronRight,
  ChevronDown,
  ArrowRight
} from 'lucide-react';

export default function OrderActivity({ onNavigate }) {
  const [timeRange, setTimeRange] = useState('Last 7 days');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const ranges = ['Today', 'Last 7 days', 'This Month', 'All time'];

  const activityData = [
    {
      id: 'new',
      title: 'New orders',
      subtitle: 'Recently placed by customers',
      count: 5,
      icon: ShoppingCart,
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
      tag: 'new',
    },
    {
      id: 'accepted',
      title: 'Accepted',
      subtitle: 'Orders confirmed',
      count: 9,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      tag: 'accepted',
    },
    {
      id: 'completed',
      title: 'Completed',
      subtitle: 'Orders marked as completed',
      count: 4,
      icon: PackageCheck,
      iconBg: 'bg-amber-50/70 text-amber-700 border border-amber-200/50',
      tag: 'completed',
    },
  ];

  const handleCardClick = (tab = 'orders') => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 shadow-xs">
              <TrendingUp className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">Order Activity</h2>
            </div>
          </div>

          {/* Time Range Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-colors"
            >
              <span>{timeRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-2xl shadow-lg py-1.5 z-20 animate-in fade-in zoom-in-95 duration-100">
                {ranges.map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => {
                      setTimeRange(range);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      timeRange === range
                        ? 'text-blue-600 font-semibold bg-blue-50/50'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity Rows */}
        <div className="divide-y divide-slate-100 mt-2">
          {activityData.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => handleCardClick('orders')}
                className="group flex items-center justify-between py-4 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-2xl ${item.iconBg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-800">
                    {item.count}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Link */}
      <div className="pt-4 border-t border-slate-100 mt-2">
        <button
          type="button"
          onClick={() => handleCardClick('orders')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors group"
        >
          <span>View all orders</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
