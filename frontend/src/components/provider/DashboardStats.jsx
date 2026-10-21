import React from 'react';
import {
  ShoppingBag,
  Users,
  Package,
  BarChart3,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

export default function DashboardStats({ onCardClick }) {
  const stats = [
    {
      id: 'today-orders',
      title: "Today's Orders",
      value: '18',
      icon: ShoppingBag,
      iconBg: 'bg-blue-50 text-blue-600',
      badge: {
        type: 'warning',
        text: '5 need attention',
      },
      linkTitle: 'View orders',
    },
    {
      id: 'subscriptions',
      title: 'Active Subscriptions',
      value: '42',
      icon: Users,
      iconBg: 'bg-emerald-50 text-emerald-600',
      subtext: 'Across 3 active plans',
      linkTitle: 'View subscriptions',
    },
    {
      id: 'plans',
      title: 'Active Tiffin Plans',
      value: '3',
      icon: Package,
      iconBg: 'bg-purple-50 text-purple-600',
      subtext: 'Manage your packages',
      linkTitle: 'Manage plans',
    },
    {
      id: 'revenue',
      title: "This Month's Revenue",
      value: '₹28,450',
      icon: BarChart3,
      iconBg: 'bg-teal-50 text-teal-600',
      subtext: 'Payments overview',
      linkTitle: 'View payouts',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            onClick={() => onCardClick?.(stat.title)}
            className="group bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
          >
            {/* Top row: Icon and chevron */}
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.iconBg} shadow-sm group-hover:scale-105 transition-transform`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
            </div>

            {/* Title & Value */}
            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                {stat.title}
              </span>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                {stat.value}
              </div>

              {/* Bottom Badge or Subtext */}
              {stat.badge ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-200/60">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{stat.badge.text}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-medium block">
                  {stat.subtext}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
