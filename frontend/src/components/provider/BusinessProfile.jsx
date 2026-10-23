import React, { useState, useEffect } from "react";
import {
  Store,
  MapPin,
  Phone,
  MessageCircle,
  Tag,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  Save,
  RotateCcw,
  Sparkles,
  Utensils,
  Plus,
  X,
  Loader2,
  Clock,
  FileCheck,
  Info,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

// Curated Indian Cuisine Cover Banners for quick preset selection
const PRESET_BANNERS = [
  {
    label: "Traditional Gujarati & Kathiyawadi Thali",
    url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Royal North Indian & Punjabi Spread",
    url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Wholesome Homestyle Tiffin Meals",
    url: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Fresh High-Protein & Vegetarian Bowls",
    url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80",
  },
];

// Curated Kitchen Avatars / Logos
const PRESET_AVATARS = [
  {
    label: "Chef Hat Bowl",
    url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80",
  },
  {
    label: "Green Salad Herb",
    url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&auto=format&fit=crop&q=80",
  },
  {
    label: "Clay Pot Tradition",
    url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80",
  },
  {
    label: "Spice Bowl",
    url: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=200&auto=format&fit=crop&q=80",
  },
];

// Popular Service Area Suggestions for fast 1-click addition
const POPULAR_AREAS = [
  "Navrangpura",
  "Satellite",
  "Ambawadi",
  "Vastrapur",
  "Bodakdev",
  "Prahlad Nagar",
  "University Area",
  "CG Road",
  "Thaltej",
  "Maninagar",
];

export default function BusinessProfile({ onPreviewKitchen, onToast }) {
  const { user, providerProfile, setProviderProfile } = useAuth();

  // Form State
  const [formData, setFormData] = useState({
    businessName: "",
    tagline: "",
    description: "",
    foodType: "BOTH",
    address: "",
    city: "Ahmedabad",
    contactNumber: "",
    whatsappNumber: "",
    serviceArea: [],
    imageUrl: "",
    bannerUrl: "",
    isAcceptingOrders: true,
    fssaiNumber: "",
    fssaiExpiry: "",
  });

  const [newAreaInput, setNewAreaInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form with live provider profile
  useEffect(() => {
    const fetchLatestProfile = async () => {
      setFetching(true);
      try {
        const res = await api.get("/provider/profile");
        const p = res.data?.data?.providerProfile || providerProfile;
        if (p) {
          const areas = Array.isArray(p.serviceArea)
            ? p.serviceArea
            : typeof p.serviceArea === "string" && p.serviceArea.trim()
              ? p.serviceArea
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              : [];

          setFormData({
            businessName: p.businessName || "",
            tagline: p.tagline || "",
            description: p.description || "",
            foodType: p.foodType || "BOTH",
            address: p.address || "",
            city: p.city || "Ahmedabad",
            contactNumber: p.contactNumber || user?.phone || "",
            whatsappNumber: p.whatsappNumber || "",
            serviceArea: areas,
            imageUrl: p.imageUrl || "",
            bannerUrl: p.bannerUrl || "",
            isAcceptingOrders:
              p.isAcceptingOrders !== undefined ? p.isAcceptingOrders : true,
            fssaiNumber: p.fssaiNumber || "",
            fssaiExpiry: p.fssaiExpiry || "",
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setFetching(false);
      }
    };

    fetchLatestProfile();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Add Service Area Tag
  const handleAddArea = (areaToAdd) => {
    const area = (areaToAdd || newAreaInput).trim();
    if (!area) return;

    if (
      formData.serviceArea.some((a) => a.toLowerCase() === area.toLowerCase())
    ) {
      onToast?.(`"${area}" is already in your delivery coverage.`);
      setNewAreaInput("");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      serviceArea: [...prev.serviceArea, area],
    }));
    setNewAreaInput("");
    setHasChanges(true);
  };

  // Remove Service Area Tag
  const handleRemoveArea = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      serviceArea: prev.serviceArea.filter((_, idx) => idx !== indexToRemove),
    }));
    setHasChanges(true);
  };

  // 1-Click Operating Status Switch
  const handleToggleOperatingStatus = async () => {
    const nextStatus = !formData.isAcceptingOrders;
    setIsTogglingStatus(true);
    try {
      const res = await api.patch("/provider/profile/status", {
        isAcceptingOrders: nextStatus,
      });

      setFormData((prev) => ({ ...prev, isAcceptingOrders: nextStatus }));

      if (providerProfile) {
        setProviderProfile({
          ...providerProfile,
          isAcceptingOrders: nextStatus,
          operatingStatus: nextStatus ? "OPEN" : "BUSY",
        });
      }

      onToast?.(
        res.data?.message ||
          (nextStatus ? "Kitchen marked OPEN" : "Kitchen marked BUSY"),
      );
    } catch (err) {
      console.error("Status toggle failed:", err);
      onToast?.(err.message || "Failed to update operating status");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Save Full Profile
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();

    if (!formData.businessName.trim()) {
      onToast?.("Please enter a business name for your kitchen.");
      return;
    }
    if (!formData.address.trim()) {
      onToast?.("Please provide physical address of your kitchen.");
      return;
    }
    if (!formData.city.trim()) {
      onToast?.("Please specify the city where you operate.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.put("/provider/profile", formData);
      if (res.data?.success && res.data?.data?.providerProfile) {
        setProviderProfile(res.data.data.providerProfile);
        setHasChanges(false);
        onToast?.("Business Profile successfully updated and live!");
      }
    } catch (err) {
      console.error("Profile update failed:", err);
      onToast?.(err.message || "Failed to save business profile changes");
    } finally {
      setLoading(false);
    }
  };

  // Reset to current server data
  const handleReset = () => {
    if (providerProfile) {
      const areas = Array.isArray(providerProfile.serviceArea)
        ? providerProfile.serviceArea
        : [];
      setFormData({
        businessName: providerProfile.businessName || "",
        tagline: providerProfile.tagline || "",
        description: providerProfile.description || "",
        foodType: providerProfile.foodType || "BOTH",
        address: providerProfile.address || "",
        city: providerProfile.city || "Ahmedabad",
        contactNumber: providerProfile.contactNumber || user?.phone || "",
        whatsappNumber: providerProfile.whatsappNumber || "",
        serviceArea: areas,
        imageUrl: providerProfile.imageUrl || "",
        bannerUrl: providerProfile.bannerUrl || "",
        isAcceptingOrders:
          providerProfile.isAcceptingOrders !== undefined
            ? providerProfile.isAcceptingOrders
            : true,
        fssaiNumber: providerProfile.fssaiNumber || "",
        fssaiExpiry: providerProfile.fssaiExpiry || "",
      });
      setHasChanges(false);
      onToast?.("Form reverted to saved profile values.");
    }
  };

  const currentBanner =
    formData.bannerUrl ||
    "/tiffin-hub-logo.svg";
  const currentAvatar =
    formData.imageUrl ||
    "/tiffin-hub-logo.svg";

  if (fetching) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-9 h-9 text-blue-600 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500">
          Loading kitchen business profile...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-12 animate-in fade-in duration-200">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight">
              Business Profile
            </h1>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
              Kitchen Identity
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Manage your public storefront, visual branding, delivery coverage,
            and operating status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* <button
            type="button"
            onClick={onPreviewKitchen}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-semibold shadow-xs hover:border-emerald-300 transition-all cursor-pointer"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Preview Public Kitchen</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button> */}

          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-semibold text-white shadow-sm transition-all cursor-pointer ${
              hasChanges
                ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                : "bg-slate-800 hover:bg-slate-900"
            }`}
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{loading ? "Saving..." : "Save Profile"}</span>
          </button>
        </div>
      </div>

      {/* 2. Kitchen Operating Status (Live Switch Card) */}
      <div
        className={`rounded-3xl p-5 sm:p-6 border transition-all shadow-xs ${
          formData.isAcceptingOrders
            ? "bg-gradient-to-r from-emerald-500/10 via-emerald-50/40 to-white border-emerald-200/90"
            : "bg-gradient-to-r from-amber-500/10 via-amber-50/40 to-white border-amber-200/90"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                formData.isAcceptingOrders
                  ? "bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20"
                  : "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20"
              }`}
            >
              <Utensils className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    formData.isAcceptingOrders
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-amber-500"
                  }`}
                />
                <h3 className="text-base font-bold text-slate-900">
                  {formData.isAcceptingOrders
                    ? "🟢 Open & Accepting New Orders"
                    : "🔴 Busy / At Capacity (New Orders Paused)"}
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                {formData.isAcceptingOrders
                  ? 'Your kitchen is actively visible in discovery and customers can freely subscribe or order. Switch to "Busy" if your kitchen reaches prep capacity.'
                  : 'Your kitchen showcase displays an "At Capacity" badge. Existing active subscribers receive their daily meals as usual, but new customers cannot place new orders.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={handleToggleOperatingStatus}
              disabled={isTogglingStatus}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                formData.isAcceptingOrders ? "bg-emerald-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                  formData.isAcceptingOrders ? "translate-x-9" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-xs font-bold text-slate-700 min-w-[70px]">
              {formData.isAcceptingOrders ? "ACCEPTING" : "PAUSED"}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-7">
        {/* 3. Visual Branding Showcase (Cover Banner & Avatar) */}
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Kitchen Visual Branding
                </h2>
                <p className="text-[11px] text-slate-400">
                  Storefront cover banner and logo avatar displayed on the
                  customer discovery page
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full">
              Customer Showcase
            </span>
          </div>

          {/* Live Visual Preview Header */}
          <div className="relative h-48 sm:h-64 w-full bg-slate-900 overflow-hidden group">
            <img
              src={currentBanner}
              alt="Kitchen Cover"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 opacity-90"
              onError={(e) => {
                e.target.src = PRESET_BANNERS[0].url;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

            {/* Avatar Pill Overlay */}
            <div className="absolute bottom-4 left-6 flex items-end gap-4">
              <div className="relative group/avatar">
                <img
                  src={currentAvatar}
                  alt={formData.businessName || "Logo"}
                  className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl object-cover border-3 border-white shadow-xl bg-white"
                  onError={(e) => {
                    e.target.src = PRESET_AVATARS[0].url;
                  }}
                />
              </div>

              <div className="mb-1 text-white">
                <h3 className="text-lg sm:text-xl font-extrabold tracking-tight drop-shadow-md">
                  {formData.businessName || "Your Kitchen Name"}
                </h3>
                <p className="text-xs text-slate-200 line-clamp-1 max-w-md drop-shadow">
                  {formData.tagline ||
                    "Home-style tiffins cooked with love and fresh ingredients"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {/* Banner Photo Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kitchen Cover Banner Photo URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={formData.bannerUrl}
                  onChange={(e) => handleChange("bannerUrl", e.target.value)}
                  placeholder="https://images.unsplash.com/... (or choose a preset below)"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>

              {/* Preset Banner Selector */}
              <div className="mt-3">
                <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                  Or pick a curated Indian cuisine cover banner:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {PRESET_BANNERS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChange("bannerUrl", preset.url)}
                      className={`group/preset relative h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer text-left ${
                        formData.bannerUrl === preset.url
                          ? "border-blue-600 ring-2 ring-blue-500/30"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover group-hover/preset:scale-105 transition-transform"
                      />
                      <span className="absolute inset-0 bg-slate-900/40 p-1.5 flex items-end">
                        <span className="text-[9px] font-bold text-white line-clamp-1">
                          {preset.label}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Logo Avatar Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kitchen Logo / Avatar URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => handleChange("imageUrl", e.target.value)}
                  placeholder="https://images.unsplash.com/... (or choose a preset below)"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <Upload className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>

              {/* Preset Avatars */}
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <span className="text-[11px] font-semibold text-slate-500">
                  Quick Avatars:
                </span>
                {PRESET_AVATARS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleChange("imageUrl", preset.url)}
                    className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                      formData.imageUrl === preset.url
                        ? "bg-blue-50 border-blue-400 text-blue-700 ring-1 ring-blue-400"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Core Business Information & Food Category */}
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-blue-600" />
              <span>Core Business Information</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              The primary kitchen name, customer pitch, and culinary food
              categories
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Business Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => handleChange("businessName", e.target.value)}
                placeholder="e.g. Green Bowl Kitchen / Sayam Tiffin Service"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Kitchen Tagline */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Kitchen Tagline / Headline
                </label>
                <span className="text-[10px] text-slate-400">
                  {formData.tagline.length}/200
                </span>
              </div>
              <input
                type="text"
                maxLength={200}
                value={formData.tagline}
                onChange={(e) => handleChange("tagline", e.target.value)}
                placeholder="e.g. Authentic Gujarati & North Indian tiffins cooked daily"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Food Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2.5">
              Food Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "VEG",
                  icon: "🌱",
                  title: "Pure Vegetarian",
                  desc: "100% vegetarian meals, Jain-friendly options available",
                  borderActive:
                    "border-emerald-500 bg-emerald-50/50 text-emerald-900",
                },
                {
                  id: "NON_VEG",
                  icon: "🍗",
                  title: "Non-Vegetarian",
                  desc: "Chicken, mutton, egg, and seafood specialties",
                  borderActive: "border-red-500 bg-red-50/50 text-red-900",
                },
                {
                  id: "BOTH",
                  icon: "🥗",
                  title: "Veg & Non-Veg",
                  desc: "Comprehensive multi-cuisine kitchen offering both",
                  borderActive: "border-blue-500 bg-blue-50/50 text-blue-900",
                },
              ].map((cat) => {
                const isSelected = formData.foodType === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleChange("foodType", cat.id)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? cat.borderActive
                        : "border-slate-200/80 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="text-2xl mb-1.5">{cat.icon}</div>
                    <div className="text-xs font-bold mb-0.5">{cat.title}</div>
                    <div className="text-[11px] text-slate-500 leading-tight">
                      {cat.desc}
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute top-3 right-3" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kitchen Story / Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Kitchen Story & Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Tell customers about your kitchen, chef specialties, quality of oils, ghee, fresh vegetables, packaging hygiene..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
            />
          </div>
        </section>

        {/* 5. Physical Location & Direct Contact */}
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Location & Verified Contact</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Physical address where meals are prepared, and contact channels
              for customer queries
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Physical Kitchen Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="e.g. 402, Shivalik Plaza, Near Commerce Six Roads"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="e.g. Ahmedabad"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Verified Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Contact Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={formData.contactNumber}
                  onChange={(e) =>
                    handleChange("contactNumber", e.target.value)
                  }
                  placeholder="e.g. +91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Business WhatsApp Number */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Business WhatsApp Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={formData.whatsappNumber}
                  onChange={(e) =>
                    handleChange("whatsappNumber", e.target.value)
                  }
                  placeholder="e.g. +91 98765 43210 (Used for instant order run-sheet & customer chat)"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <MessageCircle className="w-4 h-4 text-emerald-500 absolute left-3.5 top-3" />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Customers can click the WhatsApp icon on your public profile to
                inquire about custom meals or corporate catering.
              </span>
            </div>
          </div>
        </section>

        {/* 6. Delivery Service Coverage (Interactive Tag Input) */}
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-500" />
              <span>Delivery Service Coverage</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Specific neighborhoods and areas where your delivery partners
              dispatch tiffins
            </p>
          </div>

          {/* Interactive Tag Input */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newAreaInput}
                  onChange={(e) => setNewAreaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddArea();
                    }
                  }}
                  placeholder="Type an area name (e.g. Navrangpura) and press Enter or click Add"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>

              <button
                type="button"
                onClick={() => handleAddArea()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Area</span>
              </button>
            </div>

            {/* Active Neighborhood Tag Chips */}
            <div className="flex flex-wrap items-center gap-2 min-h-[44px] p-3 bg-slate-50/70 border border-slate-200/70 rounded-2xl">
              {formData.serviceArea.length === 0 ? (
                <span className="text-xs text-slate-400 italic">
                  No areas added yet. Add neighborhoods below where you provide
                  lunch & dinner dispatch.
                </span>
              ) : (
                formData.serviceArea.map((area, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-xs font-semibold shadow-2xs group hover:border-red-200 hover:bg-red-50/30 transition-all"
                  >
                    <span>{area}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveArea(idx)}
                      className="text-slate-400 hover:text-red-500 p-0.5 rounded-md transition-colors"
                      title={`Remove ${area}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Quick Add Pill Suggestions */}
            <div className="mt-3">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Popular Areas in {formData.city || "your city"}:
              </span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_AREAS.filter(
                  (pa) =>
                    !formData.serviceArea.some(
                      (sa) => sa.toLowerCase() === pa.toLowerCase(),
                    ),
                ).map((pa) => (
                  <button
                    key={pa}
                    type="button"
                    onClick={() => handleAddArea(pa)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-700 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-slate-400" />
                    <span>{pa}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 7. Verification Status & FSSAI Compliance Card */}
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verification & FSSAI Compliance</span>
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-600 text-white" />
              <span>Verified Partner</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* FSSAI Registration Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                FSSAI License / Registration Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={20}
                  value={formData.fssaiNumber}
                  onChange={(e) => handleChange("fssaiNumber", e.target.value)}
                  placeholder="e.g. 10020021000123 (14-digit FSSAI code)"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
                <FileCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Food Safety and Standards Authority of India official food
                business license.
              </span>
            </div>

            {/* FSSAI Expiry */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                License Validity / Expiry Date
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.fssaiExpiry}
                  onChange={(e) => handleChange("fssaiExpiry", e.target.value)}
                  placeholder="e.g. 31/12/2028 or Valid up to 2028"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>
          </div>

          {/* Trust Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-800">
                Verified Kitchen Trust Guarantee:
              </strong>{" "}
              Your kitchen's verified badge and FSSAI credential build strong
              credibility with office professionals and parents subscribing to
              recurring lunch and dinner tiffins.
            </div>
          </div>
        </section>

        {/* 8. Bottom Sticky / Action Bar */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasChanges}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
              hasChanges
                ? "text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50"
                : "text-slate-300 bg-slate-100 cursor-not-allowed"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Discard Changes</span>
          </button>

          <div className="flex items-center gap-3">
            {/* <button
              type="button"
              onClick={onPreviewKitchen}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-2xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <span>Preview Customer View</span>
            </button> */}

            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-semibold text-white shadow-sm transition-all cursor-pointer ${
                hasChanges
                  ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                  : "bg-slate-800 hover:bg-slate-900"
              }`}
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>
                {loading ? "Saving Profile..." : "Save Profile Changes"}
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
