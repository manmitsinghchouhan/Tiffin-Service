import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  MapPin,
  Calendar,
  Clock,
  Utensils,
  CheckCircle2,
  Heart,
  ChevronDown,
  Sparkles,
  Crown,
  Gem,
  Coffee,
  Sun,
  Moon,
  ArrowRight,
  ShieldCheck,
  Phone,
  AlertCircle,
  Loader2
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Curated high quality Indian cuisine image fallbacks
const FALLBACK_BANNERS = [
  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=1000&q=80'
];

const DISH_THUMBNAILS = {
  poha: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=200&q=80',
  dal: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=200&q=80',
  rice: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=200&q=80',
  roti: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=200&q=80',
  sabzi: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=200&q=80',
  paneer: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=200&q=80',
  salad: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=200&q=80',
  curd: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=200&q=80',
  tea: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=200&q=80',
  egg: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=200&q=80',
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun'
};

export default function KitchenDetailModal({ kitchenId, onClose, onSelectPlan }) {
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'plans'
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedMealFilter, setSelectedMealFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('recommended');
  const [isFavorite, setIsFavorite] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const { user, isCustomer } = useAuth();
  const [customerSubs, setCustomerSubs] = useState([]);

  // Fetch logged-in customer's subscriptions to detect pending or active plans
  useEffect(() => {
    if (user && isCustomer) {
      api.get('/customer/subscriptions')
        .then((res) => {
          setCustomerSubs(res.data?.data || []);
        })
        .catch(() => {});
    }
  }, [user, isCustomer]);

  // Auto-select current day of week on initial open
  useEffect(() => {
    const todayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
    const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    setSelectedDay(dayMap[todayIndex] || 'Monday');
  }, []);

  // Fetch kitchen details, plans, and weekly menu
  useEffect(() => {
    if (!kitchenId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    api.get(`/kitchens/${kitchenId}`)
      .then((res) => {
        if (isMounted) {
          setData(res.data?.data || null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load kitchen details');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [kitchenId]);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!kitchenId) return null;

  const kitchen = data?.kitchen;
  const plans = data?.plans || [];
  const weeklyMenu = data?.weeklyMenu || {};

  // Formatted service areas
  const serviceAreasList = Array.isArray(kitchen?.serviceArea)
    ? kitchen.serviceArea
    : (typeof kitchen?.serviceArea === 'string' && kitchen.serviceArea.trim())
    ? kitchen.serviceArea.split(',').map((s) => s.trim()).filter(Boolean)
    : ['All City Locations'];

  // Banner image with fallback
  const bannerImg = kitchen?.imageUrl && kitchen.imageUrl.trim().length > 5
    ? kitchen.imageUrl
    : FALLBACK_BANNERS[Math.abs(String(kitchenId).charCodeAt(0)) % FALLBACK_BANNERS.length];

  // Filter and sort plans for Tab 2
  const filteredPlans = plans.filter((plan) => {
    if (selectedMealFilter === 'ALL') return true;
    if (selectedMealFilter === 'BREAKFAST') return plan.mealType === 'BREAKFAST';
    if (selectedMealFilter === 'LUNCH') return plan.mealType === 'LUNCH';
    if (selectedMealFilter === 'DINNER') return plan.mealType === 'DINNER';
    if (selectedMealFilter === 'LUNCH_DINNER') return plan.mealType === 'LUNCH_DINNER';
    if (selectedMealFilter === 'ALL_MEALS') return plan.mealType === 'ALL_MEALS';
    return true;
  });

  const sortedPlans = [...filteredPlans].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'duration') return a.durationDays - b.durationDays;
    // Default recommended: popular / longer duration first
    return b.durationDays - a.durationDays;
  });

  // Current day menu meals
  const dayMenu = weeklyMenu[selectedDay] || {
    breakfast: { timing: '8:00 AM - 10:00 AM', items: [] },
    lunch: { timing: '12:30 PM - 2:00 PM', items: [] },
    dinner: { timing: '7:30 PM - 9:00 PM', items: [] }
  };

  // Helper to pick dish thumbnail - prioritizes the real image saved in DB by the provider
  const getDishThumbnail = (dish) => {
    if (!dish) {
      return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=200&q=80';
    }

    // 1. If dish object contains a saved image from the database, use it!
    if (typeof dish === 'object') {
      if (dish.image && typeof dish.image === 'string' && dish.image.trim().length > 5) {
        return dish.image.trim();
      }
      if (dish.imageUrl && typeof dish.imageUrl === 'string' && dish.imageUrl.trim().length > 5) {
        return dish.imageUrl.trim();
      }
    }

    // 2. Keyword fallback only if dish has no image stored in database
    const dishName = typeof dish === 'string' ? dish : (dish.name || '');
    const lower = dishName.toLowerCase();
    for (const [key, url] of Object.entries(DISH_THUMBNAILS)) {
      if (lower.includes(key)) return url;
    }
    return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=200&q=80';
  };

  // Default dishes fallback if kitchen menu is empty for that day
  const getDefaultDishes = (mealCategory) => {
    if (mealCategory === 'breakfast') {
      return [
        { name: 'Poha', description: 'With roasted peanuts & fresh coriander' },
        { name: 'Fruit Bowl', description: 'Fresh seasonal fruits' },
        { name: 'Masala Chai', description: 'Freshly brewed home-style chai' },
        { name: 'Boiled Egg (Optional)', description: 'Available on request' }
      ];
    }
    if (mealCategory === 'lunch') {
      return [
        { name: 'Dal Tadka', description: 'Slow-cooked yellow lentils with cumin tadka' },
        { name: 'Steamed Rice', description: 'Long grain fragrant basmati rice' },
        { name: '4 Phulkas', description: 'Hot, soft whole wheat phulkas with ghee' },
        { name: 'Seasonal Sabzi', description: 'Fresh seasonal vegetable preparation' },
        { name: 'Salad', description: 'Cucumber, carrot, onion & lemon' }
      ];
    }
    return [
      { name: 'Paneer Curry', description: 'Cottage cheese in rich tomato gravy' },
      { name: 'Jeera Rice', description: 'Aromatic cumin spiced basmati' },
      { name: 'Roti', description: 'Fresh whole wheat rotis' },
      { name: 'Mix Veg', description: 'Tender garden vegetables sautéed with mild spices' },
      { name: 'Curd', description: 'Fresh homemade chilled curd' }
    ];
  };

  const isPaused =
    kitchen?.isAcceptingOrders === false || kitchen?.operatingStatus === 'BUSY';

  const handleSubscribeClick = (plan, existingPendingSub = null) => {
    if (isPaused) {
      alert(
        `${kitchen?.businessName || 'This kitchen'} is currently at prep capacity (Paused) and not accepting new orders or subscribers.`
      );
      return;
    }

    if (onSelectPlan) {
      onSelectPlan(plan, kitchen, existingPendingSub);
    } else {
      alert(`Selected Plan: ${plan.name} (₹${plan.price} / ${plan.durationDays} days).\n\nCustomer Checkout Flow (Step B) will launch next!`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 lg:p-6 animate-fadeIn">
      
      {/* Click outside backdrop */}
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      {/* Modal Card */}
      <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-scaleUp">
        
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white/90 hover:bg-slate-100 text-slate-600 hover:text-slate-900 shadow-md border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Loading State */}
        {loading && (
          <div className="py-32 flex flex-col items-center justify-center text-center px-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Loading Kitchen Showcase...</h3>
            <p className="text-sm text-slate-500 mt-1">Fetching live menu and active subscription plans</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="py-24 flex flex-col items-center justify-center text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Unable to load details</h3>
            <p className="text-sm text-slate-500 max-w-md mt-1 mb-6">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm cursor-pointer"
            >
              Close
            </button>
          </div>
        )}

        {/* Main Content Layout */}
        {!loading && !error && kitchen && (
          <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto">
            
            {/* ================= LEFT COLUMN: KITCHEN PROFILE ================= */}
            <div className="w-full lg:w-[360px] bg-slate-50/70 border-b lg:border-b-0 lg:border-r border-slate-100 p-6 sm:p-7 flex flex-col justify-between shrink-0">
              <div className="space-y-6">
                
                {/* Kitchen Banner Photo */}
                <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-slate-200 shadow-md group">
                  <img
                    src={bannerImg}
                    alt={kitchen.businessName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                  
                  {/* Verified Badge */}
                  <div className="absolute top-3 left-3 bg-emerald-500/95 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </div>

                  {/* Favorite Heart Button */}
                  <button
                    type="button"
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-600 hover:text-red-500 flex items-center justify-center shadow-sm transition-all cursor-pointer"
                    aria-label="Add to favorites"
                  >
                    <Heart
                      className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-600'}`}
                    />
                  </button>
                </div>

                {/* Kitchen Identity & Rating */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {/* Kitchen Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-amber-500/20 shrink-0">
                      {kitchen.businessName ? kitchen.businessName.charAt(0).toUpperCase() : 'K'}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 leading-tight">
                        {kitchen.businessName}
                      </h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center text-amber-500 font-bold text-xs gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>4.8</span>
                        </div>
                        <span className="text-slate-400 text-xs font-medium">(120 reviews)</span>
                      </div>
                    </div>
                  </div>

                  {/* Location line */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {kitchen.address ? `${kitchen.address}, ` : ''}{kitchen.city}
                    </span>
                  </div>

                  {/* At Capacity / Paused Banner */}
                  {isPaused && (
                    <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-800">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Kitchen At Capacity (Paused)</span>
                      </div>
                      <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                        This kitchen has reached order capacity. You can browse the menu, but new subscriptions are currently paused.
                      </p>
                    </div>
                  )}
                </div>

                {/* Bio / Description */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-white/70 p-3.5 rounded-xl border border-slate-100">
                  {kitchen.description && kitchen.description.trim().length > 0
                    ? kitchen.description
                    : 'Fresh, healthy and home-style tiffin meals prepared with quality ingredients. We offer a variety of meals to keep you healthy everyday.'}
                </p>

                {/* Key Badges */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {/* Diet Tag */}
                  {kitchen.foodType === 'VEG' ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 font-semibold px-3 py-1.5 rounded-full border border-emerald-100">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Pure Veg
                    </span>
                  ) : kitchen.foodType === 'BOTH' ? (
                    <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 font-semibold px-3 py-1.5 rounded-full border border-amber-100">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Veg & Non-Veg
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 font-semibold px-3 py-1.5 rounded-full border border-rose-100">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      Non-Veg
                    </span>
                  )}

                  {/* Schedule */}
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 font-medium px-3 py-1.5 rounded-full border border-blue-100">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    All Days
                  </span>

                  {/* Meals */}
                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 font-medium px-3 py-1.5 rounded-full">
                    <Utensils className="w-3.5 h-3.5 text-slate-500" />
                    Breakfast, Lunch, Dinner
                  </span>
                </div>

                {/* Service Areas Section */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <div className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                      <MapPin className="w-3 h-3" />
                    </div>
                    <span>Service Areas</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {serviceAreasList.map((area, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-white border border-slate-200/80 text-slate-700 font-medium px-2.5 py-1 rounded-lg"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Daily Cutoff Deadlines Section */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <div className="w-5 h-5 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Clock className="w-3 h-3" />
                    </div>
                    <span>Daily Cutoff Deadlines</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">Lunch Order Cutoff:</span>
                      <span className="text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                        {kitchen.settings?.orderTiming?.lunchCutoff || '09:30 AM'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">Dinner Order Cutoff:</span>
                      <span className="text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                        {kitchen.settings?.orderTiming?.dinnerCutoff || '04:30 PM'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expected Delivery Slots Section */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <div className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Clock className="w-3 h-3" />
                    </div>
                    <span>Expected Delivery Slots</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">Lunch Delivery:</span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {kitchen.settings?.orderTiming?.lunchDeliveryWindow || '12:00 PM - 01:30 PM'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">Dinner Delivery:</span>
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                        {kitchen.settings?.orderTiming?.dinnerDeliveryWindow || '07:30 PM - 09:00 PM'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Phone Info */}
              {kitchen.contactNumber && (
                <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center gap-2 text-xs text-slate-500">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Verified Contact: +91 {kitchen.contactNumber}</span>
                </div>
              )}
            </div>

            {/* ================= RIGHT COLUMN: TABS (MENU & PLANS) ================= */}
            <div className="flex-1 flex flex-col p-6 sm:p-8 overflow-y-auto">
              
              {/* Top Navigation Tabs Switcher */}
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                {/* Tab 1: Weekly Menu */}
                <button
                  type="button"
                  onClick={() => setActiveTab('menu')}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                    activeTab === 'menu'
                      ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Weekly Menu</span>
                </button>

                {/* Tab 2: Tiffin Plans */}
                <button
                  type="button"
                  onClick={() => setActiveTab('plans')}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                    activeTab === 'plans'
                      ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Utensils className="w-4 h-4 text-blue-600" />
                  <span>Tiffin Plans</span>
                  <span className="text-[11px] bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-full ml-1">
                    {plans.length}
                  </span>
                </button>
              </div>

              {/* TAB 1: WEEKLY MENU CONTENT */}
              {activeTab === 'menu' && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* 7-Days Selector Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {DAYS.map((day) => {
                      const isSelected = selectedDay === day;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setSelectedDay(day)}
                          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all cursor-pointer shrink-0 ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                          }`}
                        >
                          {DAY_SHORT[day]}
                        </button>
                      );
                    })}
                  </div>

                  {/* 3 Meal Cards Grid (Breakfast, Lunch, Dinner) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                    
                    {/* Breakfast Card */}
                    <div className="bg-amber-50/40 border border-amber-100/90 rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-amber-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                            <Coffee className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">Breakfast</h4>
                            <span className="text-[11px] text-amber-700 font-medium">
                              {dayMenu.breakfast?.timing || '8:00 AM - 10:00 AM'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dishes List */}
                      <div className="space-y-2.5">
                        {(dayMenu.breakfast?.items && dayMenu.breakfast.items.length > 0
                          ? dayMenu.breakfast.items
                          : getDefaultDishes('breakfast')
                        ).map((dish, i) => (
                          <div key={i} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-amber-100/70 shadow-2xs">
                            <img
                              src={getDishThumbnail(dish)}
                              alt={typeof dish === 'string' ? dish : dish.name}
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                              onError={(e) => {
                                e.target.src =
                                  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=200&q=80';
                              }}
                            />
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {typeof dish === 'string' ? dish : dish.name}
                              </p>
                              {typeof dish === 'object' && dish.description && (
                                <p className="text-[10px] text-slate-400 truncate">{dish.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lunch Card */}
                    <div className="bg-emerald-50/40 border border-emerald-100/90 rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <Sun className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">Lunch</h4>
                            <span className="text-[11px] text-emerald-700 font-medium">
                              {kitchen.settings?.orderTiming?.lunchDeliveryWindow || dayMenu.lunch?.timing || '12:00 PM - 01:30 PM'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dishes List */}
                      <div className="space-y-2.5">
                        {(dayMenu.lunch?.items && dayMenu.lunch.items.length > 0
                          ? dayMenu.lunch.items
                          : getDefaultDishes('lunch')
                        ).map((dish, i) => (
                          <div key={i} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-emerald-100/70 shadow-2xs">
                            <img
                              src={getDishThumbnail(dish)}
                              alt={typeof dish === 'string' ? dish : dish.name}
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                              onError={(e) => {
                                e.target.src =
                                  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=200&q=80';
                              }}
                            />
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {typeof dish === 'string' ? dish : dish.name}
                              </p>
                              {typeof dish === 'object' && dish.description && (
                                <p className="text-[10px] text-slate-400 truncate">{dish.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dinner Card */}
                    <div className="bg-purple-50/40 border border-purple-100/90 rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-purple-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                            <Moon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">Dinner</h4>
                            <span className="text-[11px] text-purple-700 font-medium">
                              {kitchen.settings?.orderTiming?.dinnerDeliveryWindow || dayMenu.dinner?.timing || '07:30 PM - 09:00 PM'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dishes List */}
                      <div className="space-y-2.5">
                        {(dayMenu.dinner?.items && dayMenu.dinner.items.length > 0
                          ? dayMenu.dinner.items
                          : getDefaultDishes('dinner')
                        ).map((dish, i) => (
                          <div key={i} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-purple-100/70 shadow-2xs">
                            <img
                              src={getDishThumbnail(dish)}
                              alt={typeof dish === 'string' ? dish : dish.name}
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                              onError={(e) => {
                                e.target.src =
                                  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=200&q=80';
                              }}
                            />
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {typeof dish === 'string' ? dish : dish.name}
                              </p>
                              {typeof dish === 'object' && dish.description && (
                                <p className="text-[10px] text-slate-400 truncate">{dish.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: TIFFIN PLANS CONTENT */}
              {activeTab === 'plans' && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Header & Subtitle */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">Tiffin Plans</h3>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Choose a plan that fits your lifestyle. All plans include fresh, home-cooked meals.
                      </p>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-xs text-slate-500 font-medium">Sort by</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="recommended">Recommended</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="duration">Duration</option>
                      </select>
                    </div>
                  </div>

                  {/* Sub-Filter Pills (All, Breakfast, Lunch, Dinner, Lunch & Dinner, All Meals) */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {[
                      { id: 'ALL', label: `All Plans (${plans.length})` },
                      { id: 'BREAKFAST', label: 'Breakfast' },
                      { id: 'LUNCH', label: 'Lunch' },
                      { id: 'DINNER', label: 'Dinner' },
                      { id: 'LUNCH_DINNER', label: 'Lunch & Dinner' },
                      { id: 'ALL_MEALS', label: 'All Meals' },
                    ].map((filt) => (
                      <button
                        key={filt.id}
                        type="button"
                        onClick={() => setSelectedMealFilter(filt.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                          selectedMealFilter === filt.id
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                        }`}
                      >
                        {filt.label}
                      </button>
                    ))}
                  </div>

                  {/* Plans Grid */}
                  {sortedPlans.length === 0 ? (
                    <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                      <Utensils className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-600">No plans found in this category</p>
                      <button
                        onClick={() => setSelectedMealFilter('ALL')}
                        className="text-xs text-blue-600 hover:underline mt-2 font-semibold"
                      >
                        View all plans
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {sortedPlans.map((plan, index) => {
                        const isPopular = index === 0;
                        const isBestValue = index === sortedPlans.length - 1 && sortedPlans.length > 1;

                        const planBanner = plan.imageUrl && plan.imageUrl.trim().length > 5
                          ? plan.imageUrl
                          : FALLBACK_BANNERS[(index + 1) % FALLBACK_BANNERS.length];

                        return (
                          <div
                            key={plan._id}
                            className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
                          >
                            <div>
                              {/* Top Plan Image + Badge */}
                              <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                                <img
                                  src={planBanner}
                                  alt={plan.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

                                {/* Badge */}
                                {isPopular && (
                                  <div className="absolute top-2.5 left-2.5 bg-amber-500 text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                                    <Crown className="w-3 h-3" />
                                    <span>Popular</span>
                                  </div>
                                )}
                                {!isPopular && isBestValue && (
                                  <div className="absolute top-2.5 left-2.5 bg-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                                    <Gem className="w-3 h-3" />
                                    <span>Best Value</span>
                                  </div>
                                )}
                              </div>

                              {/* Card Body */}
                              <div className="p-4 sm:p-5 space-y-3.5">
                                <div>
                                  <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                    {plan.name}
                                  </h4>
                                  <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black text-blue-600">
                                      ₹{plan.price}
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium">
                                      / {plan.durationDays} days
                                    </span>
                                  </div>
                                  {plan.description && (
                                    <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                                      {plan.description}
                                    </p>
                                  )}
                                </div>

                                {/* Plan Badges */}
                                <div className="flex flex-wrap gap-1.5 text-[11px]">
                                  <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-slate-500" />
                                    {plan.durationDays} Days
                                  </span>

                                  <span className="bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <Utensils className="w-3 h-3 text-blue-600" />
                                    {plan.mealType?.replace('_', ' ')}
                                  </span>

                                  <span className={`px-2 py-0.5 rounded-md font-semibold ${
                                    plan.diet === 'VEG'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-rose-50 text-rose-700'
                                  }`}>
                                    {plan.diet === 'VEG' ? '🌱 Pure Veg' : '🍗 Non-Veg'}
                                  </span>
                                </div>

                                {/* Features Checklist */}
                                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                  {(plan.features && plan.features.length > 0
                                    ? plan.features
                                    : [
                                        '4 Rotis / Phulkas (per meal)',
                                        'Dal Tadka & Seasonal Sabzi',
                                        'Steamed Rice + Salad',
                                        'Fresh & hygienic ingredients'
                                      ]
                                  ).slice(0, 5).map((feat, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      <span className="truncate">{feat}</span>
                                    </div>
                                  ))}
                                </div>

                              </div>
                            </div>

                            {/* Subscribe Button / Pending / Active state */}
                            <div className="p-4 pt-0">
                              {(() => {
                                const pendingSubForPlan = customerSubs.find(
                                  (s) =>
                                    (s.planId?._id === plan._id || s.planId === plan._id) &&
                                    s.status === 'PENDING'
                                );
                                const activeSubForPlan = customerSubs.find(
                                  (s) =>
                                    (s.planId?._id === plan._id || s.planId === plan._id) &&
                                    (s.status === 'ACTIVE' || s.status === 'PAUSED')
                                );

                                if (isPaused) {
                                  return (
                                    <button
                                      type="button"
                                      disabled
                                      className="w-full bg-slate-100 border border-slate-200 text-slate-400 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm cursor-not-allowed"
                                    >
                                      <span>Kitchen At Capacity (Paused)</span>
                                    </button>
                                  );
                                }

                                if (pendingSubForPlan) {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => handleSubscribeClick(plan, pendingSubForPlan)}
                                      className="w-full bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-amber-900 font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                                      title="Click to view existing pending request"
                                    >
                                      <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                                      <span>Pending Approval ⏳</span>
                                    </button>
                                  );
                                }

                                if (activeSubForPlan) {
                                  return (
                                    <button
                                      type="button"
                                      disabled
                                      className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm cursor-default"
                                    >
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                      <span>Currently Subscribed ✓</span>
                                    </button>
                                  );
                                }

                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleSubscribeClick(plan)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                                  >
                                    <span>Subscribe Now</span>
                                    <ArrowRight className="w-4 h-4" />
                                  </button>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              )}

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
