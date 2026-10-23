import React, { useState } from 'react';
import {
  Search,
  Bell,
  CheckCircle2,
  ChevronDown,
  Menu,
  ExternalLink,
  Store,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ProviderHeader({ onOpenMobile, onTriggerNotice, onPreviewKitchen }) {
  const { user, providerProfile, logoutProvider } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const kitchenName = providerProfile?.businessName || user?.name || 'Green Bowl Kitchen';
  const avatarUrl =
    providerProfile?.imageUrl ||
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=80';

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
      {/* Left: Mobile Toggle & Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Bar matching Image 1 */}
        <div className="relative w-full max-w-md hidden sm:block">
          <input
            type="text"
            placeholder="Search orders, plans, customers..."
            onClick={() => onTriggerNotice?.('Search functionality will be connected with live orders')}
            className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-slate-200/80 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Right: Notification Bell & Kitchen Profile Pill */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          onClick={() => onTriggerNotice?.('You have no unread notifications')}
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>

        {/* Profile Pill matching Image 1 */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1 sm:pr-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200/60"
          >
            <img
              src={avatarUrl}
              alt={kitchenName}
              className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/30 shadow-sm shrink-0"
              onError={(e) => {
                e.target.src =
                  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=80';
              }}
            />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[150px]">
                {kitchenName}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3 fill-emerald-600 text-white" />
                <span>Verified Partner</span>
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>

          {/* Quick Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-2 border-b border-slate-100 mb-1">
                <div className="text-xs font-bold text-slate-900 truncate">{kitchenName}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
              </div>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onPreviewKitchen?.();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/70 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span>Preview Public Kitchen</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </button>

              <button
                onClick={logoutProvider}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
