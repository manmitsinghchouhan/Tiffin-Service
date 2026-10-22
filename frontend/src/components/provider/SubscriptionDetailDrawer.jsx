import React, { useState } from "react";
import {
  X,
  Phone,
  Mail,
  Calendar,
  Clock,
  MapPin,
  FileText,
  AlertCircle,
  Pause,
  Play,
  Trash2,
  Edit,
  CheckCircle2,
  Copy,
  Check,
  RotateCw,
  Sparkles,
} from "lucide-react";

export default function SubscriptionDetailDrawer({
  subscription,
  isOpen,
  onClose,
  onPause,
  onResume,
  onCancel,
  onUpdateAddress,
  actionLoading,
}) {
  const [activeTab, setActiveTab] = useState("overview"); // overview, plan, address, history
  const [copiedField, setCopiedField] = useState(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  // Address edit state
  const [addressForm, setAddressForm] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    landmark: "",
    contactPhone: "",
    notes: "",
  });

  if (!isOpen || !subscription) return null;

  const customer = subscription.customerId || {};
  const plan = subscription.planSnapshot || subscription.planId || {};
  const address = subscription.deliveryAddress || {};

  const handleCopy = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleOpenEditAddress = () => {
    setAddressForm({
      street: address.street || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postalCode || "",
      landmark: address.landmark || "",
      contactPhone: address.contactPhone || customer.phone || "",
      notes: subscription.notes || "",
    });
    setIsEditingAddress(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (onUpdateAddress) {
      await onUpdateAddress(subscription._id, addressForm);
      setIsEditingAddress(false);
    }
  };

  // Helper date formatters
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Timeline progress calculations
  const startDate = new Date(subscription.startDate);
  const endDate = new Date(subscription.endDate);
  const now = new Date();
  const totalDays = plan.durationDays || Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));
  const daysDelivered = subscription.daysDelivered || Math.max(0, Math.floor((now - startDate) / (1000 * 60 * 60 * 24)));
  const remainingDays = subscription.remainingDays ?? (subscription.status === "ACTIVE" ? Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))) : 0);
  const currentDay = Math.min(totalDays, daysDelivered + 1);
  const progressPct = Math.min(100, Math.max(0, Math.round((daysDelivered / totalDays) * 100)));

  // Avatar initials and pastel color
  const initials = customer.name
    ? customer.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "CU";

  const getStatusBadge = () => {
    switch (subscription.status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            ACTIVE
          </span>
        );
      case "PAUSED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            PAUSED
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            EXPIRED
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
            CANCELLED
          </span>
        );
      default:
        return null;
    }
  };

  // Expected meal delivery window
  const getMealTimeWindow = (mealType) => {
    switch (mealType) {
      case "BREAKFAST":
        return "8:00 AM – 10:00 AM";
      case "DINNER":
        return "7:30 PM – 9:00 PM";
      case "LUNCH_DINNER":
        return "Lunch: 12:30 PM & Dinner: 8:00 PM";
      case "ALL_MEALS":
        return "Breakfast, Lunch & Dinner";
      case "LUNCH":
      default:
        return "12:30 PM – 2:00 PM";
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
      />

      {/* Slide-Over Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-xl w-full bg-white z-50 shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Subscription Details</h2>
            <p className="text-xs text-slate-500">Sub ID: #{subscription._id?.slice(-8).toUpperCase()}</p>
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
          {/* Customer Summary Card */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold text-base flex items-center justify-center shadow-xs">
                  {initials}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {customer.name || "Customer Name"}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {getStatusBadge()}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Contact Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60">
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200/70">
                <div className="flex items-center gap-2 truncate text-slate-700 font-medium">
                  <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">{customer.phone || address.contactPhone || "No phone"}</span>
                </div>
                <button
                  onClick={() => handleCopy(customer.phone || address.contactPhone, "phone")}
                  className="text-slate-400 hover:text-blue-600 p-1 transition-colors"
                  title="Copy Phone"
                >
                  {copiedField === "phone" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200/70">
                <div className="flex items-center gap-2 truncate text-slate-700 font-medium">
                  <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">{customer.email || "No email"}</span>
                </div>
                <button
                  onClick={() => handleCopy(customer.email, "email")}
                  className="text-slate-400 hover:text-blue-600 p-1 transition-colors"
                  title="Copy Email"
                >
                  {copiedField === "email" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
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
              onClick={() => setActiveTab("plan")}
              className={`pb-2.5 relative transition-colors cursor-pointer ${
                activeTab === "plan"
                  ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600 after:rounded-full"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Plan Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("address")}
              className={`pb-2.5 relative transition-colors cursor-pointer ${
                activeTab === "address"
                  ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600 after:rounded-full"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Address
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`pb-2.5 relative transition-colors cursor-pointer ${
                activeTab === "history"
                  ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600 after:rounded-full"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              History
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Plan Information Card */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Plan Information</span>
                </div>

                <div className="flex items-start gap-4">
                  {plan.imageUrl ? (
                    <img
                      src={plan.imageUrl}
                      alt={plan.name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-100 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg shrink-0 border border-amber-200/60">
                      🍱
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-base leading-snug">
                      {plan.name || "Custom Tiffin Package"}
                    </h4>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-lg font-extrabold text-slate-900">
                        ₹{(subscription.totalAmount || plan.price || 0).toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        / {plan.durationDays || 30} Days
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-md">
                        🍴 {plan.mealType || "LUNCH"}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-md">
                        {plan.diet === "NON_VEG" ? "🍗 Non-Veg" : "🌱 Veg"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features Checklist */}
                {plan.features && plan.features.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Included Dishes
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Subscription Timeline Card */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Subscription Timeline</span>
                  </div>
                  {subscription.status === "ACTIVE" && remainingDays <= 3 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertCircle className="w-3 h-3 text-amber-500" />
                      Expiring Soon
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50/60 p-3 rounded-xl border border-slate-100 text-xs mb-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Start Date</span>
                    <span className="font-bold text-slate-800">{formatDate(subscription.startDate)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">End Date</span>
                    <span className="font-bold text-slate-800">{formatDate(subscription.endDate)}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-700">
                      {subscription.status === "PAUSED"
                        ? "⏸ Paused on " + formatDate(subscription.pausedAt)
                        : `${remainingDays} days left`}
                      <span className="text-slate-400 font-normal"> (Day {currentDay} of {totalDays})</span>
                    </span>
                    <span className="font-extrabold text-slate-700">{progressPct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        subscription.status === "PAUSED"
                          ? "bg-amber-400"
                          : remainingDays <= 3
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Billing & Renewal Card */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Billing & Renewal</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl font-extrabold text-slate-900">
                        ₹{(subscription.totalAmount || plan.price || 0).toLocaleString("en-IN")}
                      </span>
                      {subscription.autoRenewal ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <RotateCw className="w-3 h-3" />
                          Auto-renews
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Fixed {plan.durationDays || 30}-Day Pack
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <span className="text-slate-400 block text-[11px]">Next Renewal</span>
                    <span className="font-semibold text-slate-700">
                      {subscription.autoRenewal ? formatDate(subscription.endDate) : "Manual Re-order"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Today's Meal Status Card */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700">Today's Meal Dispatch</span>
                  {subscription.status === "ACTIVE" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Preparing for Dispatch
                    </span>
                  ) : subscription.status === "PAUSED" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Delivery On Hold
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">Inactive</span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Expected delivery window:{" "}
                  <strong className="text-slate-700 font-semibold">{getMealTimeWindow(plan.mealType)}</strong>
                </p>
              </div>

              {/* Delivery Address Card */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
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
                  <p className="font-semibold text-slate-900">{address.street || "Street address not specified"}</p>
                  <p className="text-slate-600">
                    {[address.landmark, address.city, address.state, address.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p className="text-slate-500 pt-1">
                    Contact: <span className="font-semibold text-slate-700">{address.contactPhone || customer.phone || "N/A"}</span>
                  </p>
                </div>
              </div>

              {/* Delivery Instructions / Notes Card */}
              {subscription.notes && (
                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-800 mb-1">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Customer Delivery Instructions / Notes</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed italic bg-white/80 p-2.5 rounded-xl border border-blue-100/60">
                    "{subscription.notes}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PLAN DETAILS */}
          {activeTab === "plan" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 space-y-4">
                <h4 className="font-bold text-slate-900 text-base">{plan.name}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {plan.description || "Fresh, authentic homestyle meals prepared daily with organic ingredients."}
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Duration</span>
                    <span className="font-bold text-slate-800">{plan.durationDays || 30} Days</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Meals Per Day</span>
                    <span className="font-bold text-slate-800">{plan.mealsPerDay || 1} Meal</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Delivery Schedule</span>
                    <span className="font-bold text-slate-800">{plan.deliveryDays || "All Days (Mon–Sun)"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Total Price Paid</span>
                    <span className="font-bold text-slate-800">₹{(subscription.totalAmount || plan.price || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ADDRESS */}
          {activeTab === "address" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Customer Shipping Address</h4>
                  <button
                    type="button"
                    onClick={handleOpenEditAddress}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Change Details</span>
                  </button>
                </div>

                <div className="text-xs space-y-2 text-slate-700 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Street / Flat</span>
                    <span className="font-semibold text-slate-900">{address.street || "Not provided"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Landmark</span>
                    <span className="font-semibold text-slate-800">{address.landmark || "None"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block text-[11px]">City</span>
                      <span className="font-semibold text-slate-800">{address.city || "Ahmedabad"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Postal Code</span>
                      <span className="font-semibold text-slate-800">{address.postalCode || "N/A"}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Delivery Phone</span>
                    <span className="font-semibold text-slate-800">{address.contactPhone || customer.phone || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HISTORY */}
          {activeTab === "history" && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 text-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Subscription Initiated</span>
                    <span className="text-slate-400 text-[11px]">{formatDate(subscription.createdAt)}</span>
                  </div>
                </div>

                {subscription.pausedAt && (
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      ⏸
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">Deliveries Paused</span>
                      <span className="text-slate-400 text-[11px]">{formatDate(subscription.pausedAt)}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    🍱
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Total Meals Dispatched</span>
                    <span className="text-slate-400 text-[11px]">{daysDelivered} daily meals served</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Bottom Action Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
          {subscription.status === "ACTIVE" ? (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => onPause && onPause(subscription._id)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause Deliveries</span>
            </button>
          ) : subscription.status === "PAUSED" ? (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => onResume && onResume(subscription._id)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume Deliveries</span>
            </button>
          ) : null}

          <button
            type="button"
            disabled={actionLoading}
            onClick={handleOpenEditAddress}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Edit className="w-4 h-4 text-blue-600" />
            <span>Update Address</span>
          </button>

          {["ACTIVE", "PAUSED"].includes(subscription.status) && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => setCancelConfirmOpen(true)}
              className="inline-flex items-center justify-center p-2.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Cancel Subscription"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Address Edit Modal */}
      {isEditingAddress && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Update Delivery Address</h3>
              <button
                type="button"
                onClick={() => setIsEditingAddress(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Street / Building / Flat *</label>
                <input
                  type="text"
                  required
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                  placeholder="e.g. Flat 402, Green Park Apartments"
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
                  <label className="font-semibold text-slate-700 block mb-1">Postal Code *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Landmark</label>
                  <input
                    type="text"
                    value={addressForm.landmark}
                    onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                    placeholder="Near City Mall"
                  />
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
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Delivery Notes / Dietary Instructions</label>
                <textarea
                  rows={2}
                  value={addressForm.notes}
                  onChange={(e) => setAddressForm({ ...addressForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                  placeholder="e.g. Leave with guard if not at home. Less spicy food preferred."
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
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelConfirmOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Cancel Subscription?</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Are you sure you want to cancel the subscription for{" "}
              <strong className="text-slate-800">{customer.name}</strong>? Daily deliveries will stop immediately.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCancelConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 text-xs cursor-pointer"
              >
                Keep Active
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={async () => {
                  if (onCancel) {
                    await onCancel(subscription._id);
                    setCancelConfirmOpen(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
