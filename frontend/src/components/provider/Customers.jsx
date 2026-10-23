import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserCheck,
  RotateCw,
  IndianRupee,
  Download,
  Search,
  ChevronDown,
  MoreVertical,
  Phone,
  MessageCircle,
  Eye,
  Calendar,
  Package,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";
import api from "../../services/api";
import CustomerDetailDrawer from "./CustomerDetailDrawer";

export default function Customers({ onNavigateToPlans, onToast }) {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    repeatCustomers: 0,
    lapsedCustomers: 0,
    avgLtv: 0,
    repeatRate: 0,
  });
  const [customers, setCustomers] = useState([]);
  const [plansList, setPlansList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("ALL"); // ALL, ACTIVE, REPEAT, LAPSED, NEW
  const [selectedPlanId, setSelectedPlanId] = useState("ALL");
  const [sortBy, setSortBy] = useState("recent"); // recent, spend_desc, subs_desc, name_asc

  // Drawer state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionMenuOpenId, setActionMenuOpenId] = useState(null);

  // Fetch KPI Stats, Customers and Plans
  const fetchCustomersData = async () => {
    try {
      setLoading(true);
      const [statsRes, custRes, plansRes] = await Promise.all([
        api.get("/provider/customers/stats"),
        api.get("/provider/customers?limit=100"),
        api.get("/provider/plans"),
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }

      if (custRes.data?.success) {
        setCustomers(custRes.data.data || []);
      }

      if (plansRes.data?.success) {
        setPlansList(plansRes.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load customer directory:", err);
      if (onToast) {
        onToast("Could not load customer data. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomersData();
  }, []);

  // Filter and Sort customers locally for real-time responsiveness
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((cust) => {
        // Segment / Status Filter
        if (selectedSegment === "ACTIVE" && cust.status !== "ACTIVE") return false;
        if (selectedSegment === "REPEAT" && !cust.isRepeat) return false;
        if (selectedSegment === "LAPSED" && cust.status !== "LAPSED") return false;
        if (selectedSegment === "NEW") {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          if (new Date(cust.customerSince) < thirtyDaysAgo) return false;
        }

        // Plan Filter
        if (selectedPlanId !== "ALL") {
          const currentPlan = cust.activePlan;
          if (!currentPlan) return false;
          const planMatch =
            currentPlan._id === selectedPlanId ||
            currentPlan.name === plansList.find((p) => p._id === selectedPlanId)?.name;
          if (!planMatch) return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const name = (cust.name || "").toLowerCase();
          const phone = (cust.phone || cust.primaryAddress?.contactPhone || "").toLowerCase();
          const email = (cust.email || "").toLowerCase();
          const street = (cust.primaryAddress?.street || "").toLowerCase();
          const city = (cust.primaryAddress?.city || "").toLowerCase();
          const planName = (cust.activePlan?.name || "").toLowerCase();
          const allPlanNames = (cust.activePlans || []).map((p) => (p.name || "").toLowerCase()).join(" ");

          return (
            name.includes(q) ||
            phone.includes(q) ||
            email.includes(q) ||
            street.includes(q) ||
            city.includes(q) ||
            planName.includes(q) ||
            allPlanNames.includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "spend_desc") {
          return (b.totalSpent || 0) - (a.totalSpent || 0);
        }
        if (sortBy === "subs_desc") {
          return (b.totalSubscriptions || 0) - (a.totalSubscriptions || 0);
        }
        if (sortBy === "name_asc") {
          return (a.name || "").localeCompare(b.name || "");
        }
        // Default: most recently placed order first
        return new Date(b.lastOrderDate || b.customerSince) - new Date(a.lastOrderDate || a.customerSince);
      });
  }, [customers, selectedSegment, selectedPlanId, searchQuery, sortBy, plansList]);

  // Dynamic Segment Counts
  const segmentCounts = useMemo(() => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return {
      all: customers.length,
      active: customers.filter((c) => c.status === "ACTIVE").length,
      repeat: customers.filter((c) => c.isRepeat).length,
      lapsed: customers.filter((c) => c.status === "LAPSED").length,
      new: customers.filter((c) => new Date(c.customerSince) >= thirtyDaysAgo).length,
    };
  }, [customers]);

  // Export to CSV helper
  const handleExportCSV = () => {
    if (!filteredCustomers || filteredCustomers.length === 0) {
      if (onToast) onToast("No customers to export.");
      return;
    }

    const headers = [
      "Customer Name",
      "Phone",
      "Email",
      "Status",
      "Active Plan",
      "Lifetime Spend",
      "Total Plans",
      "Delivery Street",
      "City",
      "Customer Since",
    ];

    const rows = filteredCustomers.map((c) => {
      const addr = c.primaryAddress || {};
      return [
        `"${c.name || ""}"`,
        `"${c.phone || addr.contactPhone || ""}"`,
        `"${c.email || ""}"`,
        c.status,
        `"${c.activePlan?.name || "None"}"`,
        c.totalSpent || 0,
        c.totalSubscriptions || 1,
        `"${addr.street || ""}"`,
        `"${addr.city || ""}"`,
        `"${new Date(c.customerSince).toLocaleDateString()}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customers_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onToast) onToast("Exported customers directory to CSV!");
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

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const cleanPhone = (phoneStr) => {
    if (!phoneStr) return "";
    const digits = phoneStr.replace(/\D/g, "");
    if (digits.length === 10) return `91${digits}`;
    return digits;
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight">
            Customers
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Manage your customer relationships. View their plans, order history and keep track of loyal customers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-xs font-semibold shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Customers */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Total Customers</span>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {stats.totalCustomers}
            </div>
            <span className="text-[11px] font-medium text-slate-400 mt-0.5 block">
              All time customers
            </span>
          </div>
        </div>

        {/* Card 2: Active Diners */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Active Diners</span>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {stats.activeCustomers}
            </div>
            <span className="text-[11px] font-medium text-emerald-600 mt-0.5 block">
              Currently receiving meals
            </span>
          </div>
        </div>

        {/* Card 3: Repeat Customers */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <RotateCw className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Repeat Customers</span>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {stats.repeatRate}%
            </div>
            <span className="text-[11px] font-medium text-purple-600 mt-0.5 block">
              Subscribed 2+ times
            </span>
          </div>
        </div>

        {/* Card 4: Average Spend (LTV) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <IndianRupee className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Average Spend (LTV)</span>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              ₹{(stats.avgLtv || 0).toLocaleString("en-IN")}
            </div>
            <span className="text-[11px] font-medium text-slate-400 mt-0.5 block">
              Per customer (lifetime)
            </span>
          </div>
        </div>
      </div>

      {/* 3. Search Bar & Filter Controls */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
        {/* Full Width Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, email or neighborhood..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills & Dropdowns */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
          {/* Segment Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedSegment("ALL")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedSegment === "ALL"
                  ? "bg-blue-600 text-white shadow-xs shadow-blue-500/20"
                  : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
              }`}
            >
              All ({segmentCounts.all})
            </button>

            <button
              type="button"
              onClick={() => setSelectedSegment("ACTIVE")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedSegment === "ACTIVE"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${selectedSegment === "ACTIVE" ? "bg-white" : "bg-emerald-500"}`}></span>
              <span>Active ({segmentCounts.active})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSegment("REPEAT")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedSegment === "REPEAT"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${selectedSegment === "REPEAT" ? "bg-white" : "bg-purple-500"}`}></span>
              <span>Repeat ({segmentCounts.repeat})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSegment("LAPSED")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedSegment === "LAPSED"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${selectedSegment === "LAPSED" ? "bg-white" : "bg-amber-500"}`}></span>
              <span>Lapsed ({segmentCounts.lapsed})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSegment("NEW")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedSegment === "NEW"
                  ? "bg-blue-500 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${selectedSegment === "NEW" ? "bg-white" : "bg-blue-500"}`}></span>
              <span>New ({segmentCounts.new})</span>
            </button>
          </div>

          {/* Right Dropdowns */}
          <div className="flex items-center gap-3">
            {/* Plan Filter */}
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
                <option value="spend_desc">Sort by: Highest Spend (LTV)</option>
                <option value="subs_desc">Sort by: Most Subscriptions</option>
                <option value="name_asc">Sort by: Name (A-Z)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Customers Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold">Loading customer directory...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">No customers found</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {searchQuery || selectedSegment !== "ALL" || selectedPlanId !== "ALL"
                  ? "No customer records match your current search and filter criteria."
                  : "You do not have any registered customers yet. When customers subscribe to your tiffin packages, their 360° CRM profile will appear here automatically."}
              </p>
            </div>
            {onNavigateToPlans && (
              <button
                type="button"
                onClick={onNavigateToPlans}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                <span>Promote Tiffin Plans</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Active Plan</th>
                  <th className="py-3.5 px-6">Lifetime Spend</th>
                  <th className="py-3.5 px-6">Total Plans</th>
                  <th className="py-3.5 px-6">Location</th>
                  <th className="py-3.5 px-6">Customer Since</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCustomers.map((cust, index) => {
                  const initials = getInitials(cust.name);
                  const avatarColor = avatarColors[index % avatarColors.length];
                  const addr = cust.primaryAddress || {};
                  const activePlan = cust.activePlan;

                  return (
                    <tr
                      key={cust._id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedCustomer(cust);
                        setDrawerOpen(true);
                      }}
                    >
                      {/* Customer Info (Avatar + Name + Phone + Email) */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${avatarColor}`}
                          >
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block group-hover:text-blue-600 transition-colors">
                              {cust.name}
                            </span>
                            <span className="text-slate-500 text-[11px] block">
                              {cust.phone || addr.contactPhone || "No phone"}
                            </span>
                            <span className="text-slate-400 text-[11px] block truncate max-w-[170px]">
                              {cust.email || ""}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        {cust.status === "ACTIVE" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        ) : cust.status === "PAUSED" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Paused
                          </span>
                        ) : cust.isRepeat ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            Repeat
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Lapsed
                          </span>
                        )}
                      </td>

                      {/* Active Plan(s) */}
                      <td className="py-4 px-6">
                        {cust.activePlans && cust.activePlans.length > 0 ? (
                          <div className="space-y-2">
                            {cust.activePlans.map((plan, pIdx) => (
                              <div
                                key={plan._id || pIdx}
                                className={pIdx > 0 ? "pt-1.5 border-t border-slate-100" : ""}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-800 block text-xs">
                                    {plan.name}
                                  </span>
                                  {cust.activePlans.length > 1 && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-700">
                                      #{pIdx + 1}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold">
                                    🍴 {plan.mealType || "Lunch"}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                                    {plan.diet === "NON_VEG" ? "🍗 Non-Veg" : "🌱 Veg"}
                                  </span>
                                  {plan.durationDays && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                                      {plan.durationDays}d
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : activePlan ? (
                          <div>
                            <span className="font-bold text-slate-800 block text-xs">
                              {activePlan.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold">
                                🍴 {activePlan.mealType || "Lunch"}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                                {activePlan.diet === "NON_VEG" ? "🍗 Non-Veg" : "🌱 Veg"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">None - Plan Expired</span>
                        )}
                      </td>

                      {/* Lifetime Spend */}
                      <td className="py-4 px-6">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {cust.totalSpent ? `₹${cust.totalSpent.toLocaleString("en-IN")}` : "—"}
                        </span>
                      </td>

                      {/* Total Plans */}
                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-700 text-xs">
                          {cust.totalSubscriptions || 1}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-6">
                        <span className="text-slate-600 text-xs font-medium block truncate max-w-[140px]">
                          {addr.street ? `${addr.street}, ${addr.city || ""}` : addr.city || "Ahmedabad"}
                        </span>
                      </td>

                      {/* Customer Since */}
                      <td className="py-4 px-6">
                        <span className="text-slate-500 text-xs font-medium">
                          {formatDate(cust.customerSince)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2 relative">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(cust);
                              setDrawerOpen(true);
                            }}
                            className="px-3.5 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                          >
                            View
                          </button>

                          {/* 3-dots Menu Button */}
                          <button
                            type="button"
                            onClick={() =>
                              setActionMenuOpenId(actionMenuOpenId === cust._id ? null : cust._id)
                            }
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Popover */}
                          {actionMenuOpenId === cust._id && (
                            <div className="absolute right-0 top-10 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95 text-left">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCustomer(cust);
                                  setDrawerOpen(true);
                                  setActionMenuOpenId(null);
                                }}
                                className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                <span>360° Profile</span>
                              </button>

                              <a
                                href={`tel:${cust.phone || addr.contactPhone || ""}`}
                                className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Call Customer</span>
                              </a>

                              <a
                                href={`https://wa.me/${cleanPhone(cust.phone || addr.contactPhone)}?text=${encodeURIComponent(
                                  `Hello ${cust.name || ""}, greeting from your tiffin provider!`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-current" />
                                <span>Chat on WhatsApp</span>
                              </a>
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

      {/* 5. 360° Customer Inspection Drawer */}
      <CustomerDetailDrawer
        isOpen={drawerOpen}
        customer={selectedCustomer}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedCustomer(null);
        }}
        onToast={onToast}
      />
    </div>
  );
}
