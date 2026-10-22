import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import {
  ExternalLink,
  Info,
  CheckCircle2,
  X,
  Calendar,
  Package,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Modular Dashboard Components
import ProviderSidebar from '../components/provider/ProviderSidebar';
import ProviderHeader from '../components/provider/ProviderHeader';
import DashboardStats from '../components/provider/DashboardStats';
import TodaysMenu from '../components/provider/TodaysMenu';
import OrderActivity from '../components/provider/OrderActivity';
import RecentOrders from '../components/provider/RecentOrders';
import QuickActions from '../components/provider/QuickActions';
import WeeklyMenu, { INITIAL_MENU_DATA } from '../components/provider/WeeklyMenu';
import TiffinPlans from '../components/provider/TiffinPlans';
import Subscriptions from '../components/provider/Subscriptions';

export default function ProviderDashboard({ initialTab = 'overview' }) {
  const { user, providerProfile, providerStage, loading } = useAuth();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Persistent / Live Menu Data across sessions
  const [menuData, setMenuData] = useState(() => {
    try {
      const saved = localStorage.getItem('tiffinhub_weekly_menu');
      return saved ? JSON.parse(saved) : INITIAL_MENU_DATA;
    } catch {
      return INITIAL_MENU_DATA;
    }
  });
  const [menuLoading, setMenuLoading] = useState(true);
  const [isSavingMenu, setIsSavingMenu] = useState(false);

  // Sync activeTab when initialTab prop updates
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Load provider's weekly menu from server on mount
  useEffect(() => {
    let isMounted = true;

    const fetchMenu = async () => {
      if (!user || user.role !== 'PROVIDER' || providerStage !== 'VERIFIED') {
        return;
      }
      try {
        setMenuLoading(true);
        const res = await api.get('/provider/menu');
        if (isMounted && res.data?.success && res.data?.data) {
          setMenuData(res.data.data);
          try {
            localStorage.setItem('tiffinhub_weekly_menu', JSON.stringify(res.data.data));
          } catch {}
        }
      } catch (err) {
        console.error('Failed to load weekly menu from server:', err);
      } finally {
        if (isMounted) setMenuLoading(false);
      }
    };

    fetchMenu();

    return () => {
      isMounted = false;
    };
  }, [user, providerStage]);

  const handleMenuChange = async (newMenu) => {
    // 1. Instant optimistic UI update
    setMenuData(newMenu);
    try {
      localStorage.setItem('tiffinhub_weekly_menu', JSON.stringify(newMenu));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }

    // 2. Synchronize with MongoDB via PUT /api/provider/menu
    try {
      setIsSavingMenu(true);
      const res = await api.put('/provider/menu', { menu: newMenu });
      if (res.data?.success && res.data?.data) {
        setMenuData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to sync weekly menu to server:', err);
      triggerNotice('Failed to sync changes with server. Please check your connection.');
    } finally {
      setIsSavingMenu(false);
    }
  };

  // Helper to trigger informational toast for upcoming modules
  const triggerNotice = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 3800);
  };

  // Route Guard Checks
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7fc] flex items-center justify-center text-slate-800">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-600">Loading Kitchen Dashboard...</span>
        </div>
      </div>
    );
  }

  // Guard 1: Must be logged in as Provider
  if (!user || user.role !== 'PROVIDER') {
    return <Navigate to="/provider/login" replace />;
  }

  // Guard 2: Must have completed onboarding profile
  if (providerStage === 'NEEDS_PROFILE') {
    return <Navigate to="/provider/onboarding" replace />;
  }

  // Guard 3: Must be verified by admin
  if (providerStage !== 'VERIFIED') {
    return <Navigate to="/provider/status" replace />;
  }

  const kitchenName = providerProfile?.businessName || user?.name || 'Green Bowl Kitchen';

  // Greeting based on client time
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  const handleSelectTab = (tabId) => {
    if (
      tabId === 'overview' ||
      tabId === 'weekly-menu' ||
      tabId === 'tiffin-plans' ||
      tabId === 'subscriptions'
    ) {
      setActiveTab(tabId);
    } else {
      setActiveTab(tabId);
      const tabNames = {
        'orders': 'Orders Management',
        'customers': 'Customer Directory',
        'payments': 'Payments & Earnings',
        'feedback': 'Feedback & Complaints',
        'profile': 'Business Profile',
        'settings': 'Settings',
      };
      triggerNotice(
        `${tabNames[tabId] || tabId} module will be connected in future steps.`
      );
    }
  };

  const handleQuickAction = (tab, title) => {
    if (tab === 'menu' || tab === 'weekly-menu') {
      setActiveTab('weekly-menu');
    } else if (tab === 'plans' || tab === 'tiffin-plans') {
      setActiveTab('tiffin-plans');
    } else if (tab === 'subscriptions') {
      setActiveTab('subscriptions');
    } else {
      triggerNotice(`${title} shortcut will open when that module is connected in future steps.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fc] text-slate-800 flex font-sans antialiased">
      {/* Sidebar Navigation */}
      <ProviderSidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <ProviderHeader
          onOpenMobile={() => setMobileMenuOpen(true)}
          onTriggerNotice={triggerNotice}
        />

        {/* Informational Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="bg-white border border-blue-200/90 text-slate-800 shadow-xl rounded-2xl p-4 flex items-center gap-3 max-w-md">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Info className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-slate-700 leading-snug flex-1">
                {toastMessage}
              </p>
              <button
                onClick={() => setToastMessage(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Body Container */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-7 space-y-7 max-w-[1550px] w-full mx-auto">
          {/* Active View Switcher */}
          {activeTab === 'weekly-menu' ? (
            <WeeklyMenu
              onNavigateBack={() => setActiveTab('overview')}
              menuData={menuData}
              onMenuChange={handleMenuChange}
              onToast={triggerNotice}
              isSaving={isSavingMenu}
              isLoading={menuLoading}
            />
          ) : activeTab === 'tiffin-plans' ? (
            <TiffinPlans
              onNavigateToMenu={() => setActiveTab('weekly-menu')}
              onToast={triggerNotice}
            />
          ) : activeTab === 'subscriptions' ? (
            <Subscriptions
              onNavigateToPlans={() => setActiveTab('tiffin-plans')}
              onToast={triggerNotice}
            />
          ) : activeTab === 'overview' ? (
            <>
              {/* Top Greeting Headline matching Image 1 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>{greeting},</span>
                    <span className="text-blue-600">{kitchenName}</span>
                    <span className="text-2xl">🌿</span>
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
                    Here's your kitchen at a glance.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to="/"
                    title="View public customer-facing website"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-blue-50/50 text-blue-600 border border-blue-200 rounded-2xl text-xs font-semibold shadow-xs hover:border-blue-300 transition-all cursor-pointer"
                  >
                    <span>View public profile</span>
                    <ExternalLink className="w-3.5 h-3.5 stroke-[2.2]" />
                  </Link>
                </div>
              </div>

              {/* Section B: 4 Statistics Cards */}
              <section>
                <DashboardStats onNavigate={handleSelectTab} />
              </section>

              {/* Sections C & D: Today's Menu & Order Activity (2 Column Layout) */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left: Today's Menu (approx 60-65% width) */}
                <div className="lg:col-span-7 flex">
                  <div className="w-full">
                    <TodaysMenu
                      menuData={menuData}
                      onEditMenu={() => setActiveTab('weekly-menu')}
                    />
                  </div>
                </div>

                {/* Right: Order Activity (approx 35-40% width) */}
                <div className="lg:col-span-5 flex">
                  <div className="w-full">
                    <OrderActivity onNavigate={handleSelectTab} />
                  </div>
                </div>
              </section>

              {/* Sections E & F: Recent Orders & Quick Actions (2 Column Layout) */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left: Recent Orders Table */}
                <div className="lg:col-span-7 flex">
                  <div className="w-full">
                    <RecentOrders onNavigate={handleSelectTab} />
                  </div>
                </div>

                {/* Right: Quick Actions Card */}
                <div className="lg:col-span-5 flex">
                  <div className="w-full">
                    <QuickActions onAction={handleQuickAction} />
                  </div>
                </div>
              </section>
            </>
          ) : (
            /* Fallback for other placeholder modules */
            <div className="bg-white rounded-3xl p-10 border border-slate-200/80 shadow-sm text-center max-w-2xl mx-auto my-12">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
                <Package className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2 capitalize">
                {activeTab.replace('-', ' ')} Module
              </h2>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed max-w-md mx-auto">
                This section will be fully connected to backend APIs in upcoming steps. You can explore the active <strong>Overview</strong>, <strong>Weekly Menu</strong>, and <strong>Tiffin Plans</strong> modules right now.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-2xl shadow-sm transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Overview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('weekly-menu')}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-2xl shadow-sm transition-all cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Open Weekly Menu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tiffin-plans')}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-2xl shadow-sm transition-all cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Manage Tiffin Plans</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
