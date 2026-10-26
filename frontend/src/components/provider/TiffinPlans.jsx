import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Users,
  TrendingUp,
  Eye,
  Plus,
  Search,
  ChevronDown,
  MoreVertical,
  Utensils,
  Leaf,
  Calendar,
  Check,
  ArrowRight,
  Pencil,
  Trash2,
  Power,
  Loader2,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import PlanFormModal from './PlanFormModal';

// High-res curated food images for plan cards based on diet and mealType
const PLAN_IMAGES = {
  VEG_LUNCH: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&auto=format&fit=crop&q=80',
  NON_VEG_LUNCH: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&auto=format&fit=crop&q=80',
  BREAKFAST: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80',
  DINNER: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format&fit=crop&q=80',
  DEFAULT: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&auto=format&fit=crop&q=80'
};

const getPlanImage = (plan) => {
  if (plan.imageUrl) return plan.imageUrl;
  const diet = (plan.diet || 'VEG').toUpperCase();
  const meal = (plan.mealType || 'LUNCH').toUpperCase();

  if (meal === 'BREAKFAST') return PLAN_IMAGES.BREAKFAST;
  if (meal === 'DINNER') return PLAN_IMAGES.DINNER;
  if (diet === 'NON_VEG') return PLAN_IMAGES.NON_VEG_LUNCH;
  return PLAN_IMAGES.VEG_LUNCH;
};

// Formats mealType enum into friendly label
const formatMealType = (mt) => {
  switch (mt) {
    case 'BREAKFAST':
      return 'Breakfast';
    case 'LUNCH':
      return 'Lunch';
    case 'DINNER':
      return 'Dinner';
    case 'LUNCH_DINNER':
      return 'Lunch & Dinner';
    case 'ALL_MEALS':
      return 'All Meals';
    default:
      return mt || 'Lunch';
  }
};

// Formats deliveryDays enum into friendly label
const formatDeliveryDays = (dd) => {
  switch (dd) {
    case 'ALL_DAYS':
      return 'All Days';
    case 'MON_TO_SAT':
      return 'Mon to Sat';
    case 'WEEKDAYS_ONLY':
      return 'Weekdays';
    default:
      return dd || 'All Days';
  }
};

export default function TiffinPlans({ onNavigateToMenu, onToast }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [searchQuery, setSearchQuery] = useState('');
  const [mealTypeFilter, setMealTypeFilter] = useState('ALL');
  const [dietFilter, setDietFilter] = useState('ALL');
  const [durationFilter, setDurationFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState(null);

  // Card Action Dropdown
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Fetch plans from backend
  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/provider/plans');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setPlans(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load provider plans:', err);
      setError(err.response?.data?.message || 'Failed to load tiffin plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Toggle Plan Status (Active <-> Inactive)
  const handleToggleStatus = async (e, plan) => {
    e.stopPropagation();
    const newStatus = plan.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    // Optimistic UI update
    setPlans((prev) =>
      prev.map((p) => (p._id === plan._id ? { ...p, status: newStatus } : p))
    );

    try {
      const res = await api.patch(`/provider/plans/${plan._id}/toggle-status`);
      if (res.data?.success) {
        onToast?.(`Plan marked as ${res.data.data.status}`);
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
      // Revert optimistic update
      setPlans((prev) =>
        prev.map((p) => (p._id === plan._id ? { ...p, status: plan.status } : p))
      );
      onToast?.('Failed to toggle plan status. Please try again.');
    }
  };

  // Delete Plan
  const handleDeletePlan = async (e, plan) => {
    e.stopPropagation();
    setActiveMenuId(null);

    const confirmed = window.confirm(
      `Are you sure you want to delete "${plan.name}"? If active subscribers exist, it will be safely archived instead.`
    );
    if (!confirmed) return;

    try {
      const res = await api.delete(`/provider/plans/${plan._id}`);
      if (res.data?.success) {
        if (res.data.isArchived) {
          onToast?.(res.data.message);
          setPlans((prev) =>
            prev.map((p) => (p._id === plan._id ? { ...p, status: 'INACTIVE' } : p))
          );
        } else {
          onToast?.(`Plan "${plan.name}" deleted successfully.`);
          setPlans((prev) => prev.filter((p) => p._id !== plan._id));
        }
      }
    } catch (err) {
      console.error('Failed to delete plan:', err);
      onToast?.(err.response?.data?.message || 'Failed to delete plan');
    }
  };

  // Open Edit Modal
  const handleEditClick = (e, plan) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setPlanToEdit(plan);
    setIsModalOpen(true);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setPlanToEdit(null);
    setIsModalOpen(true);
  };

  // Callback when a plan is created or updated
  const handleSaveSuccess = (savedPlan, isEdit) => {
    if (isEdit) {
      setPlans((prev) =>
        prev.map((p) => (p._id === savedPlan._id ? savedPlan : p))
      );
    } else {
      setPlans((prev) => [savedPlan, ...prev]);
    }
  };

  // Computed Metrics
  const totalPlans = plans.length;
  const activePlansCount = useMemo(
    () => plans.filter((p) => p.status === 'ACTIVE').length,
    [plans]
  );
  const inactivePlansCount = totalPlans - activePlansCount;

  // Filtered Plans List
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      // 1. Status Filter
      if (statusFilter === 'ACTIVE' && plan.status !== 'ACTIVE') return false;
      if (statusFilter === 'INACTIVE' && plan.status !== 'INACTIVE') return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = plan.name?.toLowerCase().includes(query);
        const matchDesc = plan.description?.toLowerCase().includes(query);
        const matchFeat = plan.features?.some((f) => f.toLowerCase().includes(query));
        if (!matchName && !matchDesc && !matchFeat) return false;
      }

      // 3. Meal Type
      if (mealTypeFilter !== 'ALL' && plan.mealType !== mealTypeFilter) return false;

      // 4. Diet
      if (dietFilter !== 'ALL' && plan.diet !== dietFilter) return false;

      // 5. Duration
      if (durationFilter !== 'ALL') {
        const days = Number(durationFilter);
        if (plan.durationDays !== days) return false;
      }

      return true;
    });
  }, [plans, statusFilter, searchQuery, mealTypeFilter, dietFilter, durationFilter]);

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* Top Header matching reference image */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Tiffin Plans</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Create and manage your meal plans for customers. Each plan can have its own weekly menu.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create New Plan</span>
        </button>
      </div>

      {/* 4 Stats Cards matching reference image */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Plans */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">Total Plans</span>
            <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {totalPlans}
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
              {activePlansCount} active · {inactivePlansCount} inactive
            </span>
          </div>
        </div>

        {/* Total Subscribers */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">Total Subscribers</span>
            <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              36
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
              Across all plans
            </span>
          </div>
        </div>

        {/* Active Plans */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">Active Plans</span>
            <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {activePlansCount}
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
              Currently visible to customers
            </span>
          </div>
        </div>

        {/* Total Plan Views */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Eye className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">Total Plan Views</span>
            <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              182
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
              This month
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
        {/* Left: Status Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80'
            }`}
          >
            All Plans ({totalPlans})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ACTIVE'
                ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80'
            }`}
          >
            Active ({activePlansCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('INACTIVE')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'INACTIVE'
                ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80'
            }`}
          >
            Inactive ({inactivePlansCount})
          </button>
        </div>

        {/* Right: Search & Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
          </div>

          {/* Meal Type Filter */}
          <div className="relative">
            <select
              value={mealTypeFilter}
              onChange={(e) => setMealTypeFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Meal Type</option>
              <option value="BREAKFAST">Breakfast</option>
              <option value="LUNCH">Lunch</option>
              <option value="DINNER">Dinner</option>
              <option value="LUNCH_DINNER">Lunch & Dinner</option>
              <option value="ALL_MEALS">All Meals</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Diet Filter */}
          <div className="relative">
            <select
              value={dietFilter}
              onChange={(e) => setDietFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Diet</option>
              <option value="VEG">🌱 Veg</option>
              <option value="NON_VEG">🍗 Non-Veg</option>
              <option value="BOTH">🥗 Both</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Duration Filter */}
          <div className="relative">
            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Duration</option>
              <option value="7">7 Days</option>
              <option value="15">15 Days</option>
              <option value="30">30 Days</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200/80 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
          <span className="text-xs font-semibold text-slate-600">Loading your kitchen plans...</span>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-3xl text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-xs font-bold text-red-800">{error}</p>
          <button
            type="button"
            onClick={fetchPlans}
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredPlans.length === 0 && (
        <div className="py-20 px-6 bg-white rounded-3xl border border-dashed border-slate-200 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <Package className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {searchQuery || statusFilter !== 'ALL' || mealTypeFilter !== 'ALL'
              ? 'No matching tiffin plans'
              : 'No tiffin plans created yet'}
          </h3>
          <p className="text-xs text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Try clearing your filters or search terms to see all available plans.'
              : 'Create monthly, weekly, or fortnightly tiffin packages so your customers can start subscribing.'}
          </p>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create First Plan</span>
          </button>
        </div>
      )}

      {/* 2-Column Grid of Plan Cards matching reference image */}
      {!loading && !error && filteredPlans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPlans.map((plan, index) => {
            const isActive = plan.status === 'ACTIVE';
            const isMenuOpen = activeMenuId === plan._id;
            const imageUrl = getPlanImage(plan);
            const isPopular = index === 0 && isActive;

            return (
              <div
                key={plan._id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top Header: Image, Status, Toggle, Title, Price */}
                  <div className="flex gap-4 items-start">
                    {/* Left Meal Thumbnail */}
                    <div className="relative shrink-0">
                      <img
                        src={imageUrl}
                        alt={plan.name}
                        className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-xs border border-slate-100"
                        onError={(e) => {
                          e.target.src = PLAN_IMAGES.DEFAULT;
                        }}
                      />
                      {isPopular && (
                        <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
                          Popular
                        </span>
                      )}
                    </div>

                    {/* Right Details */}
                    <div className="flex-1 min-w-0">
                      {/* Status Badge + Toggle Switch + Action Menu */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className={`inline-flex items-center text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {plan.status}
                        </span>

                        <div className="flex items-center gap-2">
                          {/* iOS Style Toggle Switch */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleStatus(e, plan)}
                            title={isActive ? 'Click to Pause Plan' : 'Click to Activate Plan'}
                            className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                              isActive ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          >
                            <div
                              className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                                isActive ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>

                          {/* Three Dots Menu Button */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(isMenuOpen ? null : plan._id);
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 mt-1.5 w-40 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-20 animate-in fade-in zoom-in-95 duration-100"
                              >
                                <button
                                  type="button"
                                  onClick={(e) => handleEditClick(e, plan)}
                                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Edit Plan</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => handleToggleStatus(e, plan)}
                                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Power className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{isActive ? 'Pause Plan' : 'Activate Plan'}</span>
                                </button>

                                <div className="my-1 border-t border-slate-100" />

                                <button
                                  type="button"
                                  onClick={(e) => handleDeletePlan(e, plan)}
                                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                  <span>Delete Plan</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug truncate">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                        {plan.description || 'Fresh home-style meals prepared daily'}
                      </p>

                      {/* Pricing & Duration Pill */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xl font-black text-slate-900 tracking-tight">
                          ₹{plan.price?.toLocaleString('en-IN') || '0'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {plan.durationDays} Days
                        </span>
                      </div>

                      {/* Metadata Chips: Meal, Diet, Days */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-semibold mt-2.5">
                        <div className="flex items-center gap-1 text-slate-500">
                          <Utensils className="w-3.5 h-3.5 text-amber-500" />
                          <span>{formatMealType(plan.mealType)}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Leaf
                            className={`w-3.5 h-3.5 ${
                              plan.diet === 'NON_VEG' ? 'text-amber-500' : 'text-emerald-500'
                            }`}
                          />
                          <span
                            className={
                              plan.diet === 'NON_VEG' ? 'text-amber-700' : 'text-emerald-700'
                            }
                          >
                            {plan.diet === 'NON_VEG'
                              ? 'Non-Veg'
                              : plan.diet === 'BOTH'
                              ? 'Both'
                              : 'Veg'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          <span>{formatDeliveryDays(plan.deliveryDays)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Features Checklist */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100">
                    {plan.features && plan.features.length > 0 ? (
                      <div className="space-y-1.5">
                        {plan.features.slice(0, 4).map((feat, fIdx) => (
                          <div
                            key={fIdx}
                            className="flex items-center gap-2 text-xs font-semibold text-slate-700"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5] shrink-0" />
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Standard daily balanced tiffin meal
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer: View Menu Link */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => onNavigateToMenu?.(plan)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors group cursor-pointer"
                  >
                    <span>View Menu</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      <PlanFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        planToEdit={planToEdit}
        onSaveSuccess={handleSaveSuccess}
        onToast={onToast}
      />
    </div>
  );
}
