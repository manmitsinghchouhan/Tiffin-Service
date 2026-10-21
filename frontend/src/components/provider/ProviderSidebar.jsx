import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Package,
  ClipboardList,
  RefreshCw,
  Users,
  CreditCard,
  MessageSquare,
  Store,
  Settings,
  LogOut,
  ChefHat,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ProviderSidebar({
  activeTab = 'overview',
  onSelectTab,
  mobileOpen = false,
  onCloseMobile,
}) {
  const { logoutProvider } = useAuth();

  const workspaceNav = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'weekly-menu', label: 'Weekly Menu', icon: Calendar },
    { id: 'tiffin-plans', label: 'Tiffin Plans', icon: Package },
    { id: 'orders', label: 'Orders', icon: ClipboardList },
    { id: 'subscriptions', label: 'Subscriptions', icon: RefreshCw },
    { id: 'customers', label: 'Customers', icon: Users },
  ];

  const managementNav = [
    { id: 'payments', label: 'Payments & Earnings', icon: CreditCard },
    { id: 'feedback', label: 'Feedback & Complaints', icon: MessageSquare },
    { id: 'profile', label: 'Business Profile', icon: Store },
  ];

  const handleNavClick = (tabId) => {
    if (onSelectTab) onSelectTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 h-screen w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between z-50 transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-5 scrollbar-thin">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                <ChefHat className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-lg tracking-tight block leading-tight">
                  Tiffin<span className="text-blue-600">Hub</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 block">
                  Partner Portal
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section 1: WORKSPACE */}
          <div className="mb-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              Workspace
            </div>
            <nav className="space-y-1">
              {workspaceNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Section 2: MANAGEMENT */}
          <div className="mb-6 relative">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              Management
            </div>
            <nav className="space-y-1">
              {managementNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Decorative soft ambient leaf silhouette */}
            <div className="pointer-events-none absolute right-2 bottom-0 w-24 h-24 opacity-5 text-blue-600">
              <svg viewBox="0 0 100 100" fill="currentColor">
                <path d="M10,80 Q30,10 80,10 Q90,50 30,85 Z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom Section: Settings & Sign Out */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <nav className="space-y-1">
            <button
              onClick={() => handleNavClick('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </button>

            <button
              onClick={logoutProvider}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>
      </aside>
    </>
  );
}
