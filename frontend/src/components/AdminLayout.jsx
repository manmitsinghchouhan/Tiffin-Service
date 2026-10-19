import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  ChefHat,
  Users,
  UtensilsCrossed,
  LogOut,
  ArrowLeft,
  Menu,
  X,
  Bell,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AdminLayout({ children, activePage = 'dashboard' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: admin, isAdmin, loading, logoutAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending count to show badge on sidebar
  useEffect(() => {
    let isMounted = true;
    const fetchPendingCount = async () => {
      try {
        const { data } = await api.get('/admin/stats');
        if (isMounted && data.success && data.data?.summary?.providers) {
          setPendingCount(data.data.summary.providers.pending || 0);
        }
      } catch (err) {
        // Silently catch background badge poll error
      }
    };

    if (admin && isAdmin) {
      fetchPendingCount();
    }

    return () => {
      isMounted = false;
    };
  }, [admin, isAdmin, location.pathname]);

  // Route Guard Check
  useEffect(() => {
    if (!loading && (!admin || !isAdmin)) {
      navigate('/admin/login');
    }
  }, [loading, admin, isAdmin, navigate]);

  const handleLogout = async () => {
    await logoutAdmin();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-sans">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-400">Verifying Admin Session...</span>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Overview',
      path: '/admin',
      icon: LayoutDashboard,
    },
    {
      id: 'providers',
      label: 'Provider Approvals',
      path: '/admin/providers',
      icon: ChefHat,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      id: 'users',
      label: 'Customer & Users',
      path: '/admin/users',
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans antialiased">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-base">TiffinHub Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar for Desktop & Mobile Drawer */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 flex flex-col justify-between z-40 transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Sidebar Header Brand */}
          <div className="p-6 border-b border-slate-800 hidden md:flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-white text-base tracking-tight block">TiffinHub</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">
                  Admin Portal
                </span>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">
              Management
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activePage === item.id ||
                (item.path === '/admin' && location.pathname === '/admin') ||
                (item.path === '/admin/providers' && location.pathname.startsWith('/admin/providers'));

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-slate-950 rounded-full shadow-sm animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Footer */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          {/* Admin User Info */}
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-800">
            <div className="text-xs font-bold text-white truncate">{admin?.name || 'Administrator'}</div>
            <div className="text-[11px] text-slate-400 truncate">{admin?.email}</div>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Online • Role: ADMIN</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-800 hidden md:flex items-center justify-between px-8 h-16 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Administrative Control Panel
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/70 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Session</span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-400 py-1.5 px-3 rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
