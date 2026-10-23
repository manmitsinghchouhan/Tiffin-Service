import React, { useState, useEffect, useMemo } from "react";
import {
  ClipboardList,
  Clock,
  Truck,
  IndianRupee,
  Search,
  Calendar,
  Utensils,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Printer,
  Download,
  Phone,
  MessageCircle,
  Copy,
  Check,
  MapPin,
  ChevronRight,
  ShieldCheck,
  FileText,
  RotateCw,
  Eye,
  Receipt,
  User,
  Filter,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import OrderDetailModal from "./OrderDetailModal";

export default function Orders({ onNavigateToPlans, onToast }) {
  const { providerProfile } = useAuth();
  const orderTiming = providerProfile?.settings?.orderTiming || {};
  const lunchWindow = orderTiming.lunchDeliveryWindow || "12:00 PM - 01:30 PM";
  const dinnerWindow = orderTiming.dinnerDeliveryWindow || "07:30 PM - 09:00 PM";

  // Top-level View Mode: 'dispatch' (Run-Sheet) | 'ledger' (Commercial Orders)
  const [viewMode, setViewMode] = useState("dispatch");

  // KPI Stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    acceptedOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    todayDeliveriesCount: 0,
    todayPausedCount: 0,
    pendingOrdersCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Rejection Confirmation Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [orderToReject, setOrderToReject] = useState(null);
  const [selectedRejectReason, setSelectedRejectReason] = useState(
    "Kitchen is currently at maximum daily prep capacity"
  );
  const [customRejectReason, setCustomRejectReason] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);

  // Tab 1: Dispatch Run-Sheet State
  const [dispatchDate, setDispatchDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [dispatchMealSlot, setDispatchMealSlot] = useState("ALL");
  const [dispatchData, setDispatchData] = useState({
    summary: {
      totalMeals: 0,
      vegCount: 0,
      nonVegCount: 0,
      pausedCount: 0,
      skippedScheduleCount: 0,
    },
    dispatchList: [],
    dayName: "",
  });
  const [loadingDispatch, setLoadingDispatch] = useState(true);

  // Persistent date-keyed dispatch status
  const [localDispatchStatus, setLocalDispatchStatus] = useState(() => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const saved = localStorage.getItem(`tiffinhub_dispatch_${today}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Sync stored progress when dispatchDate changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`tiffinhub_dispatch_${dispatchDate}`);
      setLocalDispatchStatus(saved ? JSON.parse(saved) : {});
    } catch {
      setLocalDispatchStatus({});
    }
  }, [dispatchDate]);

  // Tab 2: Orders Ledger State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);

  // Detail / Invoice Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  // Copied address tooltip helper
  const [copiedId, setCopiedId] = useState(null);

  // Avatar pastel backgrounds
  const avatarColors = [
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-pink-100 text-pink-700",
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

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper to clean phone numbers for WhatsApp / Tel
  const cleanPhone = (phoneStr) => {
    if (!phoneStr) return "";
    const digits = phoneStr.replace(/\D/g, "");
    if (digits.length === 10) return `91${digits}`;
    return digits;
  };

  // 1. Fetch KPI Stats
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await api.get("/provider/orders/stats");
      if (res.data?.success && res.data?.data) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load order stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  // 2. Fetch Daily Dispatch Run-Sheet
  const fetchDailyDispatch = async () => {
    try {
      setLoadingDispatch(true);
      const res = await api.get("/provider/orders/daily-dispatch", {
        params: {
          date: dispatchDate,
          mealType: dispatchMealSlot,
        },
      });
      if (res.data?.success && res.data?.data) {
        setDispatchData(res.data.data);
        const serverStatus = {};
        (res.data.data.dispatchList || []).forEach((item) => {
          if (item.deliveryStatus) {
            serverStatus[item._id] = item.deliveryStatus;
          }
        });
        setLocalDispatchStatus((prev) => ({
          ...prev,
          ...serverStatus,
        }));
      }
    } catch (err) {
      console.error("Failed to load daily dispatch:", err);
    } finally {
      setLoadingDispatch(false);
    }
  };

  // 3. Fetch Orders Ledger
  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await api.get("/provider/orders", {
        params: {
          status: selectedStatus,
          search: searchQuery,
          page: currentPage,
          limit: 15,
        },
      });
      if (res.data?.success && res.data?.data) {
        setOrders(res.data.data);
        setTotalPages(res.data.pages || 1);
        setTotalOrdersCount(res.data.total || 0);
      }
    } catch (err) {
      console.error("Failed to load orders ledger:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (viewMode === "dispatch") {
      fetchDailyDispatch();
    }
  }, [viewMode, dispatchDate, dispatchMealSlot]);

  useEffect(() => {
    if (viewMode === "ledger") {
      fetchOrders();
    }
  }, [viewMode, selectedStatus, searchQuery, currentPage]);

  // Quick Accept / Status Change Order
  const handleQuickStatusChange = async (orderId, newStatus) => {
    try {
      const res = await api.patch(`/provider/orders/${orderId}/status`, {
        status: newStatus,
      });
      if (res.data?.success) {
        if (onToast) {
          if (newStatus === "ACCEPTED") {
            onToast("Order accepted! Subscription is now active for kitchen dispatch.");
          } else {
            onToast(`Order marked as ${newStatus}.`);
          }
        }
        fetchOrders();
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to update order status:", err);
      if (onToast) onToast("Failed to update order status.");
    }
  };

  // Open Rejection Dialog with Reasons
  const handleOpenRejectModal = (order) => {
    setOrderToReject(order);
    setSelectedRejectReason("Kitchen is currently at maximum daily prep capacity");
    setCustomRejectReason("");
    setRejectModalOpen(true);
  };

  // Confirm Rejection with Reason
  const handleConfirmReject = async () => {
    if (!orderToReject) return;
    const finalReason =
      selectedRejectReason === "OTHER"
        ? customRejectReason.trim() || "Rejected by kitchen provider"
        : selectedRejectReason;

    try {
      setSubmittingReject(true);
      const res = await api.patch(`/provider/orders/${orderToReject._id}/status`, {
        status: "REJECTED",
        cancellationReason: finalReason,
      });
      if (res.data?.success) {
        if (onToast) onToast("Order rejected and customer subscription cancelled.");
        setRejectModalOpen(false);
        setOrderToReject(null);
        fetchOrders();
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to reject order:", err);
      if (onToast) onToast(err.response?.data?.message || "Failed to reject order.");
    } finally {
      setSubmittingReject(false);
    }
  };

  // Toggle dispatch progress pill (Preparing -> Out for Delivery -> Delivered)
  const handleToggleDispatchProgress = async (id) => {
    const current = localDispatchStatus[id] || "PREPARING";
    if (current === "DELIVERED") {
      if (onToast) onToast("Meal has already been marked delivered for today!");
      return;
    }
    const next = current === "PREPARING" ? "OUT_FOR_DELIVERY" : "DELIVERED";

    const updated = {
      ...localDispatchStatus,
      [id]: next,
    };

    setLocalDispatchStatus(updated);

    try {
      localStorage.setItem(
        `tiffinhub_dispatch_${dispatchDate}`,
        JSON.stringify(updated)
      );
    } catch (e) {
      console.warn("Failed to persist dispatch status to storage:", e);
    }

    try {
      await api.patch(`/provider/orders/dispatch-status/${id}`, {
        status: next,
        date: dispatchDate,
      });
      if (onToast) {
        const stageLabel =
          next === "OUT_FOR_DELIVERY"
            ? "🛵 Out for Delivery"
            : next === "DELIVERED"
            ? "🍱 Delivered"
            : "🍳 Cooking / Packing";
        onToast(`Meal progress updated to ${stageLabel}. Customer can see this live!`);
      }
    } catch (err) {
      console.error("Failed to update dispatch status in backend:", err);
      if (onToast) onToast("Failed to sync dispatch status with server.");
    }
  };

  // Copy address to clipboard
  const handleCopyAddress = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Print Dispatch Run-Sheet
  const handlePrintRunSheet = () => {
    window.print();
  };

  // Export Ledger to CSV
  const handleExportCSV = () => {
    if (!orders || orders.length === 0) {
      if (onToast) onToast("No orders available to export.");
      return;
    }

    const headers = [
      "Order ID",
      "Customer Name",
      "Phone",
      "Email",
      "Plan Name",
      "Duration",
      "Meal Slot",
      "Diet",
      "Amount Paid",
      "Status",
      "Order Date",
    ];

    const rows = orders.map((o) => {
      const cust = o.customerId || {};
      const plan = o.planSnapshot || {};
      return [
        `"${o.orderCode || o._id}"`,
        `"${cust.name || ""}"`,
        `"${cust.phone || ""}"`,
        `"${cust.email || ""}"`,
        `"${plan.name || ""}"`,
        `"${plan.durationDays || 30} Days"`,
        `"${plan.mealType || ""}"`,
        `"${plan.diet || ""}"`,
        `"₹${o.totalAmount || 0}"`,
        `"${o.status}"`,
        `"${formatDate(o.createdAt)}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `TiffinHub_Orders_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quick date selector helpers
  const handleSetToday = () => {
    setDispatchDate(new Date().toISOString().split("T")[0]);
  };

  const handleSetTomorrow = () => {
    const tmrw = new Date(Date.now() + 24 * 60 * 60 * 1000);
    setDispatchDate(tmrw.toISOString().split("T")[0]);
  };

  const isToday = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return dispatchDate === todayStr;
  }, [dispatchDate]);

  const isTomorrow = useMemo(() => {
    const tmrw = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    return dispatchDate === tmrw;
  }, [dispatchDate]);

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Orders & Daily Dispatch</span>
            <span className="text-2xl">🛵</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Manage commercial orders, track daily kitchen dispatch run-sheets, and print route lists.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {viewMode === "dispatch" ? (
            <button
              type="button"
              onClick={handlePrintRunSheet}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Run-Sheet</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Orders */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80 shrink-0 shadow-xs">
            <ClipboardList className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Orders
            </span>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight block mt-0.5">
              {loadingStats ? "—" : stats.totalOrders}
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              All-time customer bookings
            </span>
          </div>
        </div>

        {/* KPI 2: Today's Deliveries */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/80 shrink-0 shadow-xs">
            <Truck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Today's Deliveries
            </span>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight block mt-0.5">
              {loadingStats ? "—" : stats.todayDeliveriesCount}
            </span>
            <span className="text-[11px] font-medium text-emerald-700">
              Active subscriber meals today
            </span>
          </div>
        </div>

        {/* KPI 3: Deliveries On Hold */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/80 shrink-0 shadow-xs">
            <Clock className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Deliveries On Hold
            </span>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight block mt-0.5">
              {loadingStats
                ? "—"
                : (stats.todayPausedCount ?? dispatchData.summary.pausedCount ?? 0)}
            </span>
            <span className="text-[11px] font-medium text-amber-700">
              Subscribers paused today
            </span>
          </div>
        </div>

        {/* KPI 4: Orders Revenue */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100/80 shrink-0 shadow-xs">
            <IndianRupee className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Orders Revenue
            </span>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight block mt-0.5">
              {loadingStats ? "—" : `₹${stats.totalRevenue.toLocaleString("en-IN")}`}
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              Commercial bookings revenue
            </span>
          </div>
        </div>
      </div>

      {/* Action Required: Pending Approval Alert Banner */}
      {stats.pendingOrdersCount > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-amber-950 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
              <AlertCircle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-amber-950">
                  Action Required: {stats.pendingOrdersCount} Order{stats.pendingOrdersCount > 1 ? "s" : ""} Pending Approval
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 uppercase tracking-wider">
                  Manual Review Mode
                </span>
              </div>
              <p className="text-xs text-amber-800/90 mt-0.5">
                New customer subscriptions are waiting for kitchen confirmation before joining the daily dispatch run-sheet.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setViewMode("ledger");
              setSelectedStatus("PENDING");
              setCurrentPage(1);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-2xl shadow-sm shadow-amber-600/30 transition-all cursor-pointer shrink-0"
          >
            <span>Review in Ledger</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Dual-View Mode Switcher */}
      <div className="bg-white rounded-3xl p-2 border border-slate-200/80 shadow-xs inline-flex items-center gap-1">
        <button
          type="button"
          onClick={() => setViewMode("dispatch")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            viewMode === "dispatch"
              ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>🛵 Daily Kitchen Dispatch (Run-Sheet)</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode("ledger")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            viewMode === "ledger"
              ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>📋 Commercial Orders Ledger</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: DAILY KITCHEN DISPATCH RUN-SHEET                         */}
      {/* ============================================================== */}
      {viewMode === "dispatch" && (
        <div className="space-y-5">
          {/* Controls Bar: Date Quick Picker & Meal Slot Pills */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Date Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
                Dispatch Date:
              </span>
              <button
                type="button"
                onClick={handleSetToday}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isToday
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleSetTomorrow}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isTomorrow
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
                }`}
              >
                Tomorrow
              </button>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                  className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Right: Meal Slot Filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
                Meal Slot:
              </span>
              {[
                { id: "ALL", label: "All Slots" },
                { id: "LUNCH", label: `Lunch (${lunchWindow})` },
                { id: "DINNER", label: `Dinner (${dinnerWindow})` },
                { id: "BREAKFAST", label: "Breakfast" },
              ].map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setDispatchMealSlot(slot.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    dispatchMealSlot === slot.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200/70 text-slate-600"
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>

          {/* Kitchen Prep Tally Bar */}
          <div className="bg-linear-to-r from-blue-900 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300 block mb-1">
                  Kitchen Production Run-Sheet
                </span>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                  {dispatchData.dayName || "Today's"} Dispatch —{" "}
                  <span className="text-blue-200">{formatDate(dispatchDate)}</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Active subscribers scheduled for meal cooking & delivery routes.
                </p>
              </div>

              {/* Tally Metrics Group */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Total Meals */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                    🔥 To Cook & Pack
                  </span>
                  <div className="text-2xl font-black tracking-tight text-white mt-1">
                    {dispatchData.summary.totalMeals}{" "}
                    <span className="text-xs font-semibold text-blue-200">Thalis</span>
                  </div>
                </div>

                {/* Pure Veg */}
                <div className="bg-emerald-500/15 backdrop-blur-md rounded-2xl p-3.5 border border-emerald-400/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                    🌱 Pure Veg
                  </span>
                  <div className="text-2xl font-black tracking-tight text-emerald-300 mt-1">
                    {dispatchData.summary.vegCount}{" "}
                    <span className="text-xs font-semibold text-emerald-200">Portions</span>
                  </div>
                </div>

                {/* Non-Veg */}
                <div className="bg-rose-500/15 backdrop-blur-md rounded-2xl p-3.5 border border-rose-400/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 block">
                    🍗 Non-Veg
                  </span>
                  <div className="text-2xl font-black tracking-tight text-rose-300 mt-1">
                    {dispatchData.summary.nonVegCount}{" "}
                    <span className="text-xs font-semibold text-rose-200">Portions</span>
                  </div>
                </div>

                {/* Paused / Skipped */}
                <div className="bg-amber-500/15 backdrop-blur-md rounded-2xl p-3.5 border border-amber-400/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                    ⏸️ Paused / Skipped
                  </span>
                  <div className="text-2xl font-black tracking-tight text-amber-300 mt-1">
                    {dispatchData.summary.pausedCount}{" "}
                    <span className="text-xs font-semibold text-amber-200">On Hold</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Run-Sheet Route Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Delivery Route Manifest ({dispatchData.dispatchList.length} Subscribers)
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  🚚 Window: {dispatchMealSlot === "LUNCH" ? lunchWindow : dispatchMealSlot === "DINNER" ? dinnerWindow : `${lunchWindow} (Lunch)`}
                </span>
                <span className="text-xs text-slate-400 font-medium hidden md:inline">
                  Tip: Click dispatch pills to toggle delivery stages.
                </span>
              </div>
            </div>

            {loadingDispatch ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading route run-sheet...
              </div>
            ) : dispatchData.dispatchList.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No subscribers scheduled for delivery on this date/meal slot.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/60">
                      <th className="py-3.5 px-6">Customer & Contact</th>
                      <th className="py-3.5 px-6">Meal Details</th>
                      <th className="py-3.5 px-6">Delivery Address</th>
                      <th className="py-3.5 px-6">Kitchen / Special Notes</th>
                      <th className="py-3.5 px-6 text-right">Dispatch Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {dispatchData.dispatchList.map((item, index) => {
                      const cust = item.customer || {};
                      const addr = item.deliveryAddress || {};
                      const initials = getInitials(cust.name);
                      const avatarColor = avatarColors[index % avatarColors.length];
                      const fullAddr = [addr.street, addr.landmark, addr.city]
                        .filter(Boolean)
                        .join(", ");
                      const phone = cust.phone || addr.contactPhone || "";
                      const dispatchStage =
                        localDispatchStatus[item._id] || (item.isPaused ? "PAUSED" : "PREPARING");

                      return (
                        <tr
                          key={item._id || index}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            item.isPaused ? "bg-amber-50/30 opacity-75" : ""
                          }`}
                        >
                          {/* Customer */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${avatarColor}`}
                              >
                                {initials}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">
                                  {cust.name}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  {phone ? (
                                    <>
                                      <a
                                        href={`tel:${phone}`}
                                        title="Call Customer"
                                        className="text-slate-500 hover:text-blue-600 flex items-center gap-0.5 text-[11px]"
                                      >
                                        <Phone className="w-3 h-3 text-slate-400" />
                                        <span>{phone}</span>
                                      </a>
                                      <a
                                        href={`https://wa.me/${cleanPhone(phone)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="WhatsApp Customer"
                                        className="text-emerald-600 hover:text-emerald-700 p-0.5 rounded"
                                      >
                                        <MessageCircle className="w-3 h-3 fill-emerald-500 text-white" />
                                      </a>
                                    </>
                                  ) : (
                                    <span className="text-slate-400 text-[11px]">No phone</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Meal Details */}
                          <td className="py-4 px-6">
                            <div>
                              <span className="font-bold text-slate-800 block text-xs">
                                {item.planTitle}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold">
                                  🍴 {item.mealType || "Lunch"}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                    item.diet === "NON_VEG"
                                      ? "bg-rose-50 text-rose-700"
                                      : "bg-emerald-50 text-emerald-700"
                                  }`}
                                >
                                  {item.diet === "NON_VEG" ? "🍗 Non-Veg" : "🌱 Veg"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Delivery Address */}
                          <td className="py-4 px-6 max-w-[240px]">
                            <div className="space-y-0.5">
                              <p className="font-semibold text-slate-800 text-xs truncate">
                                {addr.street || "Address not provided"}
                              </p>
                              <p className="text-slate-500 text-[11px] truncate">
                                {[addr.landmark, addr.city].filter(Boolean).join(", ")}
                              </p>
                              {fullAddr && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyAddress(fullAddr, item._id)}
                                  className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 pt-0.5 cursor-pointer"
                                >
                                  {copiedId === item._id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span className="text-emerald-600">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy Address</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Kitchen Notes */}
                          <td className="py-4 px-6 max-w-[220px]">
                            {item.notes ? (
                              <span className="text-amber-900 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/80 text-[11px] block italic leading-tight">
                                "{item.notes}"
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">
                                Standard meal preparation
                              </span>
                            )}
                          </td>

                          {/* Dispatch Status Pill Toggle */}
                          <td className="py-4 px-6 text-right">
                            {item.isPaused ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <span>⏸️ Customer Paused</span>
                              </span>
                            ) : dispatchStage === "DELIVERED" ? (
                              <span
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs select-none"
                                title="Meal delivery completed for today"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Delivered ✓ 🍱</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleDispatchProgress(item._id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                                  dispatchStage === "OUT_FOR_DELIVERY"
                                    ? "bg-purple-50 text-purple-700 border border-purple-300 hover:bg-purple-100"
                                    : "bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-100"
                                }`}
                                title="Click to advance delivery progress"
                              >
                                {dispatchStage === "OUT_FOR_DELIVERY" ? (
                                  <>
                                    <Truck className="w-3.5 h-3.5 text-purple-600" />
                                    <span>Out for Delivery ➔</span>
                                  </>
                                ) : (
                                  <>
                                    <Utensils className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Cooking / Packing</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: COMMERCIAL ORDERS LEDGER                                 */}
      {/* ============================================================== */}
      {viewMode === "ledger" && (
        <div className="space-y-4">
          {/* Search & Status Filter Bar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by order ID (#ORD-...), customer name, phone, or address..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50/70 border border-slate-200/80 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "ALL", label: "All Orders" },
                  {
                    id: "PENDING",
                    label: "Pending Approval",
                    count: stats.pendingOrdersCount || 0,
                  },
                  { id: "ACCEPTED", label: "Accepted" },
                  { id: "COMPLETED", label: "Completed" },
                  { id: "CANCELLED", label: "Cancelled" },
                ].map((st) => {
                  const isSelected = selectedStatus === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setSelectedStatus(st.id);
                        setCurrentPage(1);
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? st.id === "PENDING"
                            ? "bg-amber-600 text-white shadow-xs"
                            : "bg-blue-600 text-white shadow-xs"
                          : st.id === "PENDING" && (st.count || 0) > 0
                          ? "bg-amber-100 hover:bg-amber-200/80 text-amber-900 border border-amber-300/80 font-bold"
                          : "bg-slate-100 hover:bg-slate-200/70 text-slate-600"
                      }`}
                    >
                      <span>{st.label}</span>
                      {st.id === "PENDING" && (st.count || 0) > 0 && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                            isSelected ? "bg-amber-800 text-white" : "bg-amber-500 text-white"
                          }`}
                        >
                          {st.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {loadingOrders ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Loading commercial orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No orders found matching the filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/60">
                      <th className="py-3.5 px-6">Order ID & Date</th>
                      <th className="py-3.5 px-6">Customer</th>
                      <th className="py-3.5 px-6">Subscribed Plan</th>
                      <th className="py-3.5 px-6">Amount</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {orders.map((o, idx) => {
                      const cust = o.customerId || {};
                      const plan = o.planSnapshot || o.planId || {};
                      const initials = getInitials(cust.name);
                      const avatarColor = avatarColors[idx % avatarColors.length];
                      const orderCode = o.orderCode || `#ORD-${o._id?.slice(-6).toUpperCase()}`;

                      return (
                        <tr
                          key={o._id}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          {/* Order ID */}
                          <td className="py-4 px-6">
                            <div>
                              <span className="font-mono font-bold text-slate-900 block text-xs">
                                {orderCode}
                              </span>
                              <span className="text-[11px] text-slate-400 block mt-0.5">
                                {formatDate(o.orderDate || o.createdAt)} • {formatTime(o.orderDate || o.createdAt)}
                              </span>
                            </div>
                          </td>

                          {/* Customer */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${avatarColor}`}
                              >
                                {initials}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">
                                  {cust.name || "Customer"}
                                </span>
                                <span className="text-slate-500 text-[11px] block">
                                  {cust.phone || o.deliveryAddress?.contactPhone || "No phone"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Plan */}
                          <td className="py-4 px-6">
                            <div>
                              <span className="font-bold text-slate-800 block text-xs">
                                {plan.name || "Tiffin Meal Package"}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold">
                                  🍴 {plan.mealType || "Lunch"}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                                  {plan.diet === "NON_VEG" ? "🍗 Non-Veg" : "🌱 Veg"}
                                </span>
                                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                                  {plan.durationDays || 30}d
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="py-4 px-6">
                            <div>
                              <span className="font-extrabold text-slate-900 text-sm block">
                                ₹{(o.totalAmount || 0).toLocaleString("en-IN")}
                              </span>
                              {o.status === "CANCELLED" ? (
                                <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded inline-block mt-0.5 border border-rose-200/60">
                                  Refund Pending
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded inline-block mt-0.5">
                                  Paid Online
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-6">
                            {o.status === "PENDING" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                Pending
                              </span>
                            ) : o.status === "ACCEPTED" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Accepted
                              </span>
                            ) : o.status === "COMPLETED" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                Completed
                              </span>
                            ) : o.status === "CANCELLED" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Cancelled
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                {o.status}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {o.status === "PENDING" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickStatusChange(o._id, "ACCEPTED")}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs cursor-pointer transition-colors flex items-center gap-1"
                                    title="Accept Order & Activate Subscription"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Accept</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRejectModal(o)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs cursor-pointer transition-colors flex items-center gap-1"
                                    title="Reject Order with Reason"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedOrder(o);
                                  setInvoiceModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                <span>Invoice</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Showing page <strong className="text-slate-800">{currentPage}</strong> of{" "}
                  <strong className="text-slate-800">{totalPages}</strong> ({totalOrdersCount} total orders)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={invoiceModalOpen}
        onClose={() => {
          setInvoiceModalOpen(false);
          setSelectedOrder(null);
        }}
        onStatusUpdate={() => {
          fetchOrders();
          fetchStats();
        }}
        onToast={onToast}
        onReject={(ord) => {
          setInvoiceModalOpen(false);
          handleOpenRejectModal(ord);
        }}
      />

      {/* Rejection Confirmation Modal with Reason Selection */}
      {rejectModalOpen && orderToReject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 my-8 relative">
            {/* Close button */}
            <button
              type="button"
              onClick={() => {
                setRejectModalOpen(false);
                setOrderToReject(null);
              }}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0 shadow-xs">
                <XCircle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Reject Subscription Order
                </h3>
                <p className="text-xs text-slate-500">
                  {orderToReject.orderCode || `#ORD-${orderToReject._id?.slice(-6).toUpperCase()}`} • {orderToReject.customerId?.name || "Customer"}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Please select or provide a reason for declining this order. The customer will be informed and their subscription will be cancelled.
            </p>

            {/* Preset Reason Options */}
            <div className="space-y-2 mb-4">
              {[
                {
                  id: "Kitchen is currently at maximum daily prep capacity",
                  label: "Kitchen at maximum prep capacity",
                },
                {
                  id: "Delivery address is outside our operational service radius",
                  label: "Delivery address outside coverage radius",
                },
                {
                  id: "Cannot accommodate requested custom dietary preferences",
                  label: "Cannot meet dietary customizations",
                },
                {
                  id: "OTHER",
                  label: "Other reason (specify below)",
                },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                    selectedRejectReason === opt.id
                      ? "border-rose-300 bg-rose-50/60 font-bold text-rose-950 shadow-2xs"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50/60 text-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    value={opt.id}
                    checked={selectedRejectReason === opt.id}
                    onChange={(e) => setSelectedRejectReason(e.target.value)}
                    className="accent-rose-600 cursor-pointer"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            {/* Custom Reason Textarea if "OTHER" */}
            {selectedRejectReason === "OTHER" && (
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Specify Rejection Reason:
                </label>
                <textarea
                  rows={2}
                  value={customRejectReason}
                  onChange={(e) => setCustomRejectReason(e.target.value)}
                  placeholder="Type reason to share with customer..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                />
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setRejectModalOpen(false);
                  setOrderToReject(null);
                }}
                disabled={submittingReject}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={submittingReject || (selectedRejectReason === "OTHER" && !customRejectReason.trim())}
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {submittingReject ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
