import React, { useState, useEffect } from "react";
import {
  X,
  Phone,
  Mail,
  Calendar,
  Clock,
  MapPin,
  FileText,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  IndianRupee,
  Package,
  CheckCircle2,
  AlertCircle,
  Edit,
  Save,
  Copy,
  Check,
  Utensils,
  History,
  RotateCw,
} from "lucide-react";
import api from "../../services/api";

export default function CustomerDetailDrawer({
  customer,
  isOpen,
  onClose,
  onToast,
}) {
  const [activeTab, setActiveTab] = useState("overview"); // overview, subscriptions, orders
  const [customerDetails, setCustomerDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Notes editing state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Address editing state
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    street: "",
    city: "",
    landmark: "",
    contactPhone: "",
  });
  const [savingAddress, setSavingAddress] = useState(false);

  // Fetch full 360-degree customer details when customer ID changes
  useEffect(() => {
    if (!isOpen || !customer?._id) return;

    let isMounted = true;
    const fetchFullProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/provider/customers/${customer._id}`);
        if (isMounted && res.data?.success) {
          setCustomerDetails(res.data.data);
          setNotesText(res.data.data.primaryAddress?.notes || customer.notes || "");
        }
      } catch (err) {
        console.error("Failed to fetch customer 360 profile:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFullProfile();
    return () => {
      isMounted = false;
    };
  }, [isOpen, customer?._id]);

  if (!isOpen || !customer) return null;

  const data = customerDetails || {};
  const metrics = data.metrics || {
    totalSpent: customer.totalSpent || 0,
    totalSubscriptions: customer.totalSubscriptions || 1,
    firstOrderDate: customer.customerSince,
    lastOrderDate: customer.lastOrderDate,
  };
  const activeSub = data.activeSubscription || (customer.status === "ACTIVE" ? { planSnapshot: customer.activePlan } : null);
  
  // All active subscriptions list (handles single or multiple active plans)
  const activeSubsList = (data.activeSubscriptions && data.activeSubscriptions.length > 0)
    ? data.activeSubscriptions
    : (customer.activePlans && customer.activePlans.length > 0)
    ? customer.activePlans.map((p, idx) => ({ _id: `plan-${idx}`, planSnapshot: p, status: "ACTIVE" }))
    : activeSub
    ? [activeSub]
    : [];

  // All subscriptions list for history & complete plan visibility
  const allSubsList = (data.subscriptionHistory && data.subscriptionHistory.length > 0)
    ? data.subscriptionHistory
    : (data.allSubscriptions && data.allSubscriptions.length > 0)
    ? data.allSubscriptions
    : activeSubsList;

  const primaryAddress = data.primaryAddress || customer.primaryAddress || {};

  // Compute latest delivery date across all active subscriptions
  const lastDeliveryDate = activeSubsList.length > 0
    ? activeSubsList.reduce((maxDate, s) => {
        const d = s.endDate ? new Date(s.endDate) : null;
        return d && (!maxDate || d > maxDate) ? d : maxDate;
      }, null)
    : metrics.lastOrderDate;

  const handleCopy = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
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

  // Clean phone number for tel & WhatsApp links (digits only, prefix country code 91 if needed)
  const cleanPhone = (phoneStr) => {
    if (!phoneStr) return "";
    const digits = phoneStr.replace(/\D/g, "");
    if (digits.length === 10) return `91${digits}`;
    return digits;
  };

  const phoneHref = `tel:${customer.phone || primaryAddress.contactPhone || ""}`;
  const whatsappHref = `https://wa.me/${cleanPhone(customer.phone || primaryAddress.contactPhone)}?text=${encodeURIComponent(
    `Hello ${customer.name || ""}, greeting from your tiffin service!`
  )}`;
  const mailHref = `mailto:${customer.email || ""}`;

  // Avatar initials
  const initials = customer.name
    ? customer.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "CU";

  // Save notes
  const handleSaveNotes = async () => {
    const targetSubId = activeSubsList[0]?._id || activeSub?._id;
    if (!targetSubId) {
      setIsEditingNotes(false);
      return;
    }
    try {
      setSavingNotes(true);
      await api.patch(`/provider/subscriptions/${targetSubId}/address`, {
        notes: notesText,
      });
      if (onToast) onToast("Customer notes updated successfully.");
      setIsEditingNotes(false);
    } catch (err) {
      console.error("Failed to update notes:", err);
      if (onToast) onToast("Failed to save notes.");
    } finally {
      setSavingNotes(false);
    }
  };

  // Save Address
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    const targetSubId = activeSubsList[0]?._id || activeSub?._id;
    if (!targetSubId) {
      setIsEditingAddress(false);
      return;
    }
    try {
      setSavingAddress(true);
      await api.patch(`/provider/subscriptions/${targetSubId}/address`, addressForm);
      if (onToast) onToast("Delivery address updated successfully.");
      setCustomerDetails((prev) => ({
        ...prev,
        primaryAddress: { ...prev.primaryAddress, ...addressForm },
      }));
      setIsEditingAddress(false);
    } catch (err) {
      console.error("Failed to update address:", err);
      if (onToast) onToast("Failed to update address.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleOpenEditAddress = () => {
    setAddressForm({
      street: primaryAddress.street || "",
      city: primaryAddress.city || "",
      landmark: primaryAddress.landmark || "",
      contactPhone: primaryAddress.contactPhone || customer.phone || "",
    });
    setIsEditingAddress(true);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
      />

      {/* Slide-Over Right Panel */}
      <div className="fixed inset-y-0 right-0 max-w-xl w-full bg-white z-50 shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Customer Details</h2>
            <p className="text-xs text-slate-500">ID: #{customer._id?.slice(-8).toUpperCase()}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Customer Hero Card */}
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-full bg-blue-100 text-blue-700 font-extrabold text-base flex items-center justify-center shadow-xs">
                  {initials}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg leading-tight">
                    {customer.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {customer.status === "ACTIVE" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active
                      </span>
                    ) : customer.status === "PAUSED" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Paused
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Lapsed
                      </span>
                    )}

                    {metrics.totalSubscriptions >= 2 && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        Repeat Customer
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-1.5 text-xs text-slate-600 pb-3 border-b border-slate-200/70">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{customer.phone || primaryAddress.contactPhone || "No phone added"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(customer.phone || primaryAddress.contactPhone, "phone")}
                  className="text-slate-400 hover:text-blue-600 p-1 transition-colors"
                >
                  {copiedField === "phone" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate max-w-[280px]">{customer.email || "No email"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(customer.email, "email")}
                  className="text-slate-400 hover:text-blue-600 p-1 transition-colors"
                >
                  {copiedField === "email" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Quick Contact Action Pills */}
            <div className="grid grid-cols-3 gap-2.5 pt-3">
              <a
                href={phoneHref}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold text-xs border border-slate-200 shadow-2xs transition-all"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Call</span>
              </a>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 font-semibold text-xs border border-emerald-200 shadow-2xs transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-current" />
                <span>WhatsApp</span>
              </a>

              <a
                href={mailHref}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 shadow-2xs transition-all"
              >
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>Email</span>
              </a>
            </div>
          </div>

          {/* Drawer Tab Navigation */}
          <div className="flex items-center gap-6 border-b border-slate-100 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`pb-2.5 relative transition-colors cursor-pointer ${
                activeTab === "overview"
                  ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600 after:rounded-full"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("subscriptions")}
              className={`pb-2.5 relative transition-colors cursor-pointer ${
                activeTab === "subscriptions"
                  ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600 after:rounded-full"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Subscriptions ({allSubsList.length || metrics.totalSubscriptions || 1})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`pb-2.5 relative transition-colors cursor-pointer ${
                activeTab === "orders"
                  ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600 after:rounded-full"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Meals & Deliveries
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Lifetime Stats (4 Grid Cards) */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                  <span>Lifetime Stats</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <IndianRupee className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">Total Spent</span>
                    </div>
                    <div className="text-xl font-extrabold text-slate-900 tracking-tight pl-1">
                      ₹{(metrics.totalSpent || 0).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Package className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">Total Plans</span>
                    </div>
                    <div className="text-xl font-extrabold text-slate-900 tracking-tight pl-1">
                      {metrics.totalSubscriptions}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">First Order</span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 tracking-tight pl-1">
                      {formatDate(metrics.firstOrderDate)}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">Last Delivery</span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 tracking-tight pl-1">
                      {formatDate(lastDeliveryDate || activeSub?.endDate || metrics.lastOrderDate)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Plan(s) Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
                    <Utensils className="w-3.5 h-3.5 text-blue-600" />
                    <span>Active {activeSubsList.length > 1 ? `Plans (${activeSubsList.length})` : "Plan"}</span>
                  </div>
                  {activeSubsList.length > 1 && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {activeSubsList.length} Active Plans Subscribed
                    </span>
                  )}
                </div>

                {activeSubsList.length > 0 ? (
                  activeSubsList.map((sub, idx) => {
                    const plan = sub.planSnapshot || sub.planId || {};
                    return (
                      <div
                        key={sub._id || idx}
                        className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2 relative"
                      >
                        {activeSubsList.length > 1 && (
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              Active Plan #{idx + 1}
                            </span>
                            {sub.autoRenewal && (
                              <span className="text-[10px] font-semibold text-blue-600 flex items-center gap-1">
                                <RotateCw className="w-2.5 h-2.5" /> Auto-renews
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">
                              {plan.name || "Tiffin Meal Package"}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold">
                                🍴 {plan.mealType || "Lunch"}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                                {plan.diet === "NON_VEG" ? "🍗 Non-Veg" : "🌱 Veg"}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                                {plan.durationDays || 30} Days
                              </span>
                            </div>
                          </div>

                          <span className="text-sm font-extrabold text-slate-900">
                            ₹{(sub.totalAmount || plan.price || 0).toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {formatDate(sub.startDate)} – {formatDate(sub.endDate)}
                            </span>
                          </div>

                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {sub.remainingDays !== undefined ? `${sub.remainingDays} days left` : "Active"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs py-4 text-center text-xs text-slate-400">
                    No active plan. Customer subscription has lapsed or expired.
                  </div>
                )}
              </div>

              {/* Delivery Address Card */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>Delivery Address</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenEditAddress}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>

                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1">
                  <p className="font-semibold text-slate-900">{primaryAddress.street || "Street address not specified"}</p>
                  <p className="text-slate-600">
                    {[primaryAddress.landmark, primaryAddress.city, primaryAddress.state, primaryAddress.postalCode]
                      .filter(Boolean)
                      .join(", ") || "City not set"}
                  </p>
                  <p className="text-slate-500 pt-1">
                    Contact: <span className="font-semibold text-slate-700">{primaryAddress.contactPhone || customer.phone || "N/A"}</span>
                  </p>
                </div>
              </div>

              {/* Delivery Instructions / Kitchen Notes */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Delivery Instructions / Kitchen Notes</span>
                  </div>
                  {!isEditingNotes ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingNotes(true)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  ) : null}
                </div>

                {isEditingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      placeholder="e.g. Ring bell twice. Less spicy food preferred. Allergic to peanuts."
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingNotes(false)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={savingNotes}
                        onClick={handleSaveNotes}
                        className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {savingNotes ? "Saving..." : "Save Note"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-700 bg-slate-50/70 p-3 rounded-xl border border-slate-100 leading-relaxed italic">
                    {notesText || customer.notes || "No special dietary instructions or kitchen notes recorded."}
                  </p>
                )}
              </div>

              {/* All Subscribed Plans Quick Summary */}
              {allSubsList.length > 0 && (
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                      <Package className="w-4 h-4 text-purple-600" />
                      <span>All Subscribed Plans ({allSubsList.length})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("subscriptions")}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Full Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {allSubsList.map((sub, idx) => {
                      const plan = sub.planSnapshot || sub.planId || {};
                      const isAct = sub.status === "ACTIVE";
                      const isPau = sub.status === "PAUSED";
                      return (
                        <div
                          key={sub._id || idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">
                                {plan.name || "Tiffin Plan"}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                                  isAct
                                    ? "bg-emerald-100 text-emerald-800"
                                    : isPau
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {sub.status || "ACTIVE"}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 block">
                              {formatDate(sub.startDate)} – {formatDate(sub.endDate)}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-extrabold text-slate-900 block">
                              ₹{(sub.totalAmount || plan.price || 0).toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              🍴 {plan.mealType || "Lunch"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SUBSCRIPTIONS HISTORY */}
          {activeTab === "subscriptions" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  All Plans with this Kitchen ({allSubsList.length})
                </h4>
                <span className="text-xs text-slate-400">
                  Total Spent: <strong className="text-slate-700 font-bold">₹{(metrics.totalSpent || 0).toLocaleString("en-IN")}</strong>
                </span>
              </div>

              {allSubsList.length > 0 ? (
                allSubsList.map((sub, idx) => {
                  const plan = sub.planSnapshot || sub.planId || {};
                  return (
                    <div
                      key={sub._id || idx}
                      className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-slate-900 text-sm">
                              {plan.name || "Tiffin Plan"}
                            </h5>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                sub.status === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : sub.status === "PAUSED"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {sub.status || "ACTIVE"}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold">
                              🍴 {plan.mealType || "Lunch"}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                              {plan.diet === "NON_VEG" ? "🍗 Non-Veg" : "🌱 Veg"}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                              {plan.durationDays || 30} Days
                            </span>
                          </div>
                        </div>

                        <span className="text-sm font-extrabold text-slate-900">
                          ₹{(sub.totalAmount || plan.price || 0).toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {formatDate(sub.startDate)} – {formatDate(sub.endDate)}
                          </span>
                        </div>

                        {sub.status === "ACTIVE" ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {sub.remainingDays !== undefined ? `${sub.remainingDays} days left` : "Active"}
                          </span>
                        ) : sub.autoRenewal ? (
                          <span className="text-blue-600 font-semibold flex items-center gap-1">
                            <RotateCw className="w-2.5 h-2.5" /> Auto-renews
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-xs text-slate-400">
                  No subscription records found.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MEALS & DELIVERIES */}
          {activeTab === "orders" && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Total Lifetime Meal Days</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {metrics.totalSubscriptions * 30} meals
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Member Since</span>
                  <span className="font-bold text-slate-800">{formatDate(customer.customerSince)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Delivery Slot(s)</span>
                  <span className="font-bold text-slate-800">
                    {activeSubsList.length > 0
                      ? activeSubsList
                          .map((s) => s.planSnapshot?.mealType || s.planId?.mealType || "Lunch")
                          .join(", ")
                      : activeSub?.planSnapshot?.mealType || "Lunch"}
                  </span>
                </div>
              </div>

              {primaryAddress.street && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600">
                  <span className="font-bold text-slate-900 block mb-1">Dispatch Hub:</span>
                  <p>{primaryAddress.street}, {primaryAddress.city}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Customer since {formatDate(customer.customerSince)}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </div>

      {/* Edit Address Modal */}
      {isEditingAddress && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Update Customer Address</h3>
              <button
                type="button"
                onClick={() => setIsEditingAddress(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Street / Building *</label>
                <input
                  type="text"
                  required
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Landmark</label>
                  <input
                    type="text"
                    value={addressForm.landmark}
                    onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  required
                  value={addressForm.contactPhone}
                  onChange={(e) => setAddressForm({ ...addressForm, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {savingAddress ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
