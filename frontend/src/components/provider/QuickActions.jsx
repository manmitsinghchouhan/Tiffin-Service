import React from 'react';
import {
  Zap,
  CalendarDays,
  PackagePlus,
  ClipboardCheck,
  ChevronRight
} from 'lucide-react';

export default function QuickActions({ onAction }) {
  const actions = [
    {
      id: 'menu',
      title: 'Edit weekly menu',
      subtitle: 'Update your weekly meal schedule',
      icon: CalendarDays,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100/80',
      tab: 'menu',
    },
    {
      id: 'plans',
      title: 'Create tiffin plan',
      subtitle: 'Add or manage subscription plans',
      icon: PackagePlus,
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-100/80',
      tab: 'plans',
    },
    {
      id: 'subscriptions',
      title: 'Manage subscribers',
      subtitle: 'View active subscribers & daily meals',
      icon: ClipboardCheck,
      iconBg: 'bg-purple-50 text-purple-600 border border-purple-100/80',
      tab: 'subscriptions',
    },
  ];

  const handleClick = (action) => {
    if (onAction) {
      onAction(action.tab, action.title);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 shadow-xs">
            <Zap className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">Quick Actions</h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="divide-y divide-slate-100 mt-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.id}
                onClick={() => handleClick(action)}
                className="group flex items-center justify-between py-4 cursor-pointer hover:bg-slate-50/70 -mx-3 px-3 rounded-2xl transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-2xl ${action.iconBg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">
                      {action.subtitle}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
