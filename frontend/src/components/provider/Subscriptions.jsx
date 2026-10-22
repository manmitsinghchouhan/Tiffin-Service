import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  PauseCircle,
  Calendar,
  IndianRupee,
  Download,
  Search,
  ChevronDown,
  MoreVertical,
  ShieldAlert,
  Clock,
  RotateCw,
  Eye,
  Edit,
  Play,
  Pause,
  Trash2,
  Sparkles,
  Package,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import api from "../../services/api";
import SubscriptionDetailDrawer from "./SubscriptionDetailDrawer";

export default function Subscriptions({ onNavigateToPlans, onToast }) {
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    activeCount: 0,
    pausedCount: 0,
    expiringSoonCount: 0,
    activeRevenue: 0,
  });
  const [subscriptions, setSubscriptions] = useState([]);
  const [plansList, setPlansList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Search
  const [selectedStatus, setSelectedStatus] = useState("ALL"); // ALL, ACTIVE, PAUSED, EXPIRING, CANCELLED
  const [selectedPlanId, setSelectedPlanId] = useState("ALL");
  const [sortBy, setSortBy] = useState("recent"); // recent, expiring, amount, duration
  const [searchQuery, setSearchQuery] = useState("");

  // Drawer & Actions
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionMenuOpenId, setActionMenuOpenId] = useState(null);

  // Fetch KPI Stats, Subscriptions and Provider Plans
  const fetchSubscriptionsData = async () => {
    try {
      setLoading(true);
      const [statsRes, subsRes, plansRes] = await Promise.all([
        api.get("/provider/subscriptions/stats"),
        api.get("/provider/subscriptions?limit=100"),
        api.get("/provider/plans"),
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }

      if (subsRes.data?.success) {
        setSubscriptions(subsRes.data.data || []);
      }

      if (plansRes.data?.success) {
        setPlansList(plansRes.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load provider subscriptions data:", err);
      if (onToast) {
        onToast("Could not load subscription data. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionsData();
  }, []);

  // Filter and Sort Subscriptions locally for lightning-fast responsiveness
  const filteredSubscriptions = useMemo(() => {
    return subscriptions
      .filter((sub) => {
        // Status Filter
        if (selectedStatus === "ACTIVE" && sub.status !== "ACTIVE") return false;
        if (selectedStatus === "PAUSED" && sub.status !== "PAUSED") return false;
        if (selectedStatus === "EXPIRING" && (!sub.isExpiringSoon || sub.status !== "ACTIVE"))
          return false;
        if (selectedStatus === "CANCELLED" && sub.status !== "CANCELLED") return false;

        // Plan Filter
        if (selectedPlanId !== "ALL") {
          const subPlanId = sub.planId?._id || sub.planId;
          if (subPlanId !== selectedPlanId) return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const customerName = (sub.customerId?.name || "").toLowerCase();
          const customerPhone = (sub.customerId?.phone || sub.deliveryAddress?.contactPhone || "").toLowerCase();
          const street = (sub.deliveryAddress?.street || "").toLowerCase();
          const city = (sub.deliveryAddress?.city || "").toLowerCase();
          const planName = (sub.planSnapshot?.name || sub.planId?.name || "").toLowerCase();

          return (
            customerName.includes(q) ||
            customerPhone.includes(q) ||
            street.includes(q) ||
            city.includes(q) ||
            planName.includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "recent") {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        if (sortBy === "expiring") {
          return new Date(a.endDate) - new Date(b.endDate);
        }
        if (sortBy === "amount") {
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        }
        if (sortBy === "duration") {
          return (
            (b.planSnapshot?.durationDays || 30) -
            (a.planSnapshot?.durationDays || 30)
          );
        }
        return 0;
      });
  }, [subscriptions, selectedStatus, selectedPlanId, searchQuery, sortBy]);

  // Compute status counts for pill badges
  const statusCounts = useMemo(() => {
    return {
      all: subscriptions.length,
      active: subscriptions.filter((s) => s.status === "ACTIVE").length,
      paused: subscriptions.filter((s) => s.status === "PAUSED").length,
      expiring: subscriptions.filter((s) => s.status === "ACTIVE" && s.isExpiringSoon).length,
      cancelled: subscriptions.filter((s) => s.status === "CANCELLED").length,
    };
  }, [subscriptions]);

  // Handle Pause
  const handlePause = async (id) => {
    try {
      setActionLoading(true);
      const res = await api.patch(`/provider/subscriptions/${id}/pause`);
      if (res.data?.success) {
        if (onToast) onToast("Deliveries paused for this subscriber.");
        await fetchSubscriptionsData();
        if (selectedSubscription && selectedSubscription._id === id) {
          setSelectedSubscription((prev) => ({ ...prev, status: "PAUSED", pausedAt: new Date() }));
        }
      }
    } catch (err) {
      console.error("Failed to pause subscription:", err);
      if (onToast) onToast(err.response?.data?.message || "Failed to pause subscription.");
    } finally {
      setActionLoading(false);
      setActionMenuOpenId(null);
    }
  };

  // Handle Resume
  const handleResume = async (id) => {
    try {
      setActionLoading(true);
      const res = await api.patch(`/provider/subscriptions/${id}/resume`);
      if (res.data?.success) {
        if (onToast) onToast("Subscription resumed. Meals are active again!");
        await fetchSubscriptionsData();
        if (selectedSubscription && selectedSubscription._id === id) {
          setSelectedSubscription((prev) => ({ ...prev, status: "ACTIVE", pausedAt: null }));
        }
      }
    } catch (err) {
      console.error("Failed to resume subscription:", err);
      if (onToast) onToast(err.response?.data?.message || "Failed to resume subscription.");
    } finally {
      setActionLoading(false);
      setActionMenuOpenId(null);
    }
  };

  // Handle Cancel
  const handleCancel = async (id) => {
    try {
      setActionLoading(true);
      const res = await api.patch(`/provider/subscriptions/${id}/cancel`);
      if (res.data?.success) {
        if (onToast) onToast("Subscription cancelled.");
        await fetchSubscriptionsData();
        if (selectedSubscription && selectedSubscription._id === id) {
          setSelectedSubscription((prev) => ({ ...prev, status: "CANCELLED", autoRenewal: false }));
        }
      }
    } catch (err) {
      console.error("Failed to cancel subscription:", err);
      if (onToast) onToast(err.response?.data?.message || "Failed to cancel subscription.");
    } finally {
      setActionLoading(false);
      setActionMenuOpenId(null);
    }
  };

  // Handle Address Update
  const handleUpdateAddress = async (id, updatedForm) => {
    try {
      setActionLoading(true);
      const res = await api.patch(`/provider/subscriptions/${id}/address`, updatedForm);
      if (res.data?.success) {
        if (onToast) onToast("Delivery address updated successfully.");
        await fetchSubscriptionsData();
        if (selectedSubscription && selectedSubscription._id === id) {
          setSelectedSubscription((prev) => ({
            ...prev,
            deliveryAddress: { ...prev.deliveryAddress, ...updatedForm },
            notes: updatedForm.notes,
          }));
        }
      }
    } catch (err) {
      console.error("Failed to update address:", err);
      if (onToast) onToast(err.response?.data?.message || "Failed to update address.");
    } finally {
      setActionLoading(false);
    }
  };

  // Export to CSV helper
  const handleExportCSV = () => {
    if (!filteredSubscriptions || filteredSubscriptions.length === 0) {
      if (onToast) onToast("No subscriptions to export.");
      return;
    }

    const headers = [
      "Customer Name",
      "Phone",
      "Email",
      "Plan Name",
      "Meal Type",
      "Diet",
      "Start Date",
      "End Date",
      "Remaining Days",
      "Price",
      "Auto Renewal",
      "Status",
      "Delivery Street",
      "City",
      "Notes",
    ];

    const rows = filteredSubscriptions.map((sub) => {
      const cust = sub.customerId || {};
      const plan = sub.planSnapshot || sub.planId || {};
      const addr = sub.deliveryAddress || {};
      return [
        `"${cust.name || ""}"`,
        `"${cust.phone || addr.contactPhone || ""}"`,
        `"${cust.email || ""}"`,
        `"${plan.name || ""}"`,
        `"${plan.mealType || ""}"`,
        `"${plan.diet || ""}"`,
        `"${new Date(sub.startDate).toLocaleDateString()}"`,
        `"${new Date(sub.endDate).toLocaleDateString()}"`,
        sub.remainingDays || 0,
        sub.totalAmount || plan.price || 0,
        sub.autoRenewal ? "Yes" : "No",
        sub.status,
        `"${addr.street || ""}"`,
        `"${addr.city || ""}"`,
        `"${sub.notes || ""}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `subscriptions_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onToast) onToast("Exported subscriptions to CSV!");
  };

  // Avatar pastel colors array
  const avatarColors = [
    "bg-blue-100 text-blue-700",
    "bg-pink-100 text-pink-700",
    "bg-purple-100 text-purple-700",
    "bg-amber-100 text-amber-700",
    "bg-emerald-100 text-emerald-700",
    "bg-rose-100 text-rose-700",
    "bg-indigo-100 text-indigo-700",
  ];

  const getInitials = (name) => {
    if (!name) return "CU";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const formatDateRange = (start, end) => {
    if (!start || !end) return "N/A";
    const s = new Date(start).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const e = new Date(end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    return `${s} – ${e}`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight">
            Subscriptions
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Manage all your customer subscriptions. View active subscribers, paused deliveries, upcoming expirations and more.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-xs font-semibold shadow-xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Active Subscribers */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Active Subscribers</span>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {stats.activeCount}
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
              <span>↑ Active daily meals</span>
            </span>
          </div>
        </div>

        {/* Card 2: Deliveries on Hold */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <PauseCircle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Deliveries on Hold</span>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {stats.pausedCount}
            </div>
            <span className="text-[11px] font-medium text-slate-400 mt-0.5 block">
              Customers paused
            </span>
          </div>
        </div>

        {/* Card 3: Expiring in <= 3 Days */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Expiring in ≤ 3 Days</span>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {stats.expiringSoonCount}
            </div>
            <span className="text-[11px] font-semibold text-purple-600 mt-0.5 block">
              Needs attention
            </span>
          </div>
        </div>

        {/* Card 4: Active Subscription Revenue */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <IndianRupee className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Active Subscription Revenue</span>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              ₹{(stats.activeRevenue || 0).toLocaleString("en-IN")}
            </div>
            <span className="text-[11px] font-medium text-slate-400 mt-0.5 block">
              From {stats.activeCount} active plans
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Search Controls */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Tabs Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedStatus("ALL")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedStatus === "ALL"
                  ? "bg-blue-600 text-white shadow-xs shadow-blue-500/20"
                  : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
              }`}
            >
              All ({statusCounts.all})
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus("ACTIVE")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedStatus === "ACTIVE"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${selectedStatus === "ACTIVE" ? "bg-white" : "bg-emerald-500"}`}></span>
              <span>Active ({statusCounts.active})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus("PAUSED")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedStatus === "PAUSED"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${selectedStatus === "PAUSED" ? "bg-white" : "bg-amber-500"}`}></span>
              <span>Paused ({statusCounts.paused})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus("EXPIRING")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedStatus === "EXPIRING"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${selectedStatus === "EXPIRING" ? "bg-white" : "bg-purple-500"}`}></span>
              <span>Expiring Soon ({statusCounts.expiring})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus("CANCELLED")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedStatus === "CANCELLED"
                  ? "bg-red-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${selectedStatus === "CANCELLED" ? "bg-white" : "bg-red-500"}`}></span>
              <span>Cancelled ({statusCounts.cancelled})</span>
            </button>
          </div>

          {/* Right Dropdowns: Plan & Sort */}
          <div className="flex items-center gap-3">
            {/* Plan Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold px-3.5 py-2 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Plans</option>
                {plansList.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold px-3.5 py-2 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="recent">Sort by: Recent First</option>
                <option value="expiring">Sort by: Expiring Soonest</option>
                <option value="amount">Sort by: Highest Amount</option>
                <option value="duration">Sort by: Longest Duration</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Search Bar Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone or address..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 4. Subscriptions Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold">Loading subscriptions...</p>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">No subscriptions found</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {searchQuery || selectedStatus !== "ALL" || selectedPlanId !== "ALL"
                  ? "No subscriber records match your current search and filter criteria."
                  : "You do not have any customer subscriptions yet. Customers can subscribe to your tiffin packages from the platform discovery page."}
              </p>
            </div>
            {onNavigateToPlans && (
              <button
                type="button"
                onClick={onNavigateToPlans}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                <span>View & Manage Tiffin Plans</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Plan</th>
                  <th className="py-3.5 px-6">Duration</th>
                  <th className="py-3.5 px-6">Billing & Renewal</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSubscriptions.map((sub, index) => {
                  const customer = sub.customerId || {};
                  const plan = sub.planSnapshot || sub.planId || {};
                  const address = sub.deliveryAddress || {};
                  const initials = getInitials(customer.name);
                  const avatarColor = avatarColors[index % avatarColors.length];

                  return (
                    <tr
                      key={sub._id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedSubscription(sub);
                        setDrawerOpen(true);
                      }}
                    >
                      {/* Customer Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${avatarColor}`}
                          >
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block group-hover:text-blue-600 transition-colors">
                              {customer.name || "Customer"}
                            </span>
                            <span className="text-slate-500 text-[11px] block">
                              {customer.phone || address.contactPhone || "No contact"}
                            </span>
                            <span className="text-slate-400 text-[11px] block truncate max-w-[150px]">
                              {address.street ? `${address.street}, ${address.city || ""}` : address.city || "Ahmedabad"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Plan Info */}
                      <td className="py-4 px-6">
                        <div>
                          <span className="font-bold text-slate-800 block text-xs">
                            {plan.name || "Tiffin Meal Plan"}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold">
                              🍴 {plan.mealType || "Lunch"}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                              {plan.diet === "NON_VEG" ? "🍗 Non-Veg" : "🌱 Veg"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="py-4 px-6">
                        <div>
                          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{formatDateRange(sub.startDate, sub.endDate)}</span>
                          </div>

                          <div className="mt-1">
                            {sub.status === "ACTIVE" && sub.isExpiringSoon ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                {sub.remainingDays <= 1 ? "Expires tomorrow" : `${sub.remainingDays} days left`}
                              </span>
                            ) : sub.status === "ACTIVE" ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                <Clock className="w-3 h-3 text-emerald-600" />
                                <span>{sub.remainingDays} days left</span>
                              </span>
                            ) : sub.status === "PAUSED" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                                <Pause className="w-3 h-3 fill-current" />
                                Paused
                              </span>
                            ) : sub.status === "EXPIRED" ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                                <CheckCircle2 className="w-3 h-3 text-slate-400" />
                                Completed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
                                <AlertTriangle className="w-3 h-3" />
                                Cancelled
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Billing & Renewal */}
                      <td className="py-4 px-6">
                        <div>
                          <span className="font-extrabold text-slate-900 block text-sm">
                            ₹{(sub.totalAmount || plan.price || 0).toLocaleString("en-IN")}
                          </span>
                          <div className="mt-1">
                            {sub.autoRenewal ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                <RotateCw className="w-2.5 h-2.5" />
                                Auto-renews
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                                Fixed Pack
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        {sub.status === "ACTIVE" ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ACTIVE
                          </span>
                        ) : sub.status === "PAUSED" ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            PAUSED
                          </span>
                        ) : sub.status === "EXPIRED" ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            EXPIRED
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-600 border border-red-200">
                            CANCELLED
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2 relative">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSubscription(sub);
                              setDrawerOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                          >
                            View Details
                          </button>

                          {/* 3-dots Menu Button */}
                          <button
                            type="button"
                            onClick={() =>
                              setActionMenuOpenId(actionMenuOpenId === sub._id ? null : sub._id)
                            }
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Quick Action Popover */}
                          {actionMenuOpenId === sub._id && (
                            <div className="absolute right-0 top-10 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95 text-left">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSubscription(sub);
                                  setDrawerOpen(true);
                                  setActionMenuOpenId(null);
                                }}
                                className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                <span>View Full Profile</span>
                              </button>

                              {sub.status === "ACTIVE" ? (
                                <button
                                  type="button"
                                  onClick={() => handlePause(sub._id)}
                                  className="w-full px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                                >
                                  <Pause className="w-3.5 h-3.5 fill-current" />
                                  <span>Pause Deliveries</span>
                                </button>
                              ) : sub.status === "PAUSED" ? (
                                <button
                                  type="button"
                                  onClick={() => handleResume(sub._id)}
                                  className="w-full px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  <span>Resume Deliveries</span>
                                </button>
                              ) : null}

                              {["ACTIVE", "PAUSED"].includes(sub.status) && (
                                <button
                                  type="button"
                                  onClick={() => handleCancel(sub._id)}
                                  className="w-full px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100 mt-1 pt-1.5"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Cancel Subscription</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Subscription Detail Drawer */}
      <SubscriptionDetailDrawer
        isOpen={drawerOpen}
        subscription={selectedSubscription}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedSubscription(null);
        }}
        onPause={handlePause}
        onResume={handleResume}
        onCancel={handleCancel}
        onUpdateAddress={handleUpdateAddress}
        actionLoading={actionLoading}
      />
    </div>
  );
}
