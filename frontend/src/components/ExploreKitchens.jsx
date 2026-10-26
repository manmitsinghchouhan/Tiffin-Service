import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  Star,
  ShieldCheck,
  Heart,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Utensils,
  Loader2,
  X,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';
import KitchenDetailModal from './KitchenDetailModal';
import SubscribeModal from './customer/SubscribeModal';
import { useAuth } from '../context/AuthContext';

// Official TiffinHub default brand cover for kitchens without a custom image
const TIFFIN_HUB_DEFAULT_IMAGE = '/tiffin-hub-logo.svg';

export default function ExploreKitchens() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isCustomer } = useAuth();

  const [kitchens, setKitchens] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedDiet, setSelectedDiet] = useState('ALL'); // 'ALL' | 'VEG' | 'NON_VEG' | 'BOTH'

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Modal State
  const [selectedKitchenId, setSelectedKitchenId] = useState(null);
  const [subscribingPlan, setSubscribingPlan] = useState(null);

  // Auto-resume subscription flow if returned from login/register
  const autoKitchenId = searchParams.get('subscribeKitchenId');
  const autoPlanId = searchParams.get('subscribePlanId');

  useEffect(() => {
    if (autoKitchenId && autoPlanId) {
      api.get(`/kitchens/${autoKitchenId}`)
        .then((res) => {
          const kData = res.data?.data;
          if (kData?.kitchen && Array.isArray(kData.plans)) {
            const matchedPlan = kData.plans.find((p) => p._id === autoPlanId);
            if (matchedPlan) {
              setSubscribingPlan({ plan: matchedPlan, kitchen: kData.kitchen });
              // Clean up search params from URL without refreshing
              window.history.replaceState({}, '', window.location.pathname);
            }
          }
        })
        .catch((err) => {
          console.error('Failed to auto-resume subscription flow:', err);
        });
    }
  }, [autoKitchenId, autoPlanId]);

  const handleSelectPlan = (plan, kitchen, existingPendingSub = null) => {
    if (user && isCustomer) {
      setSubscribingPlan({ plan, kitchen, existingPendingSub });
    } else {
      // Redirect to the existing Login page with state
      navigate('/login', {
        state: {
          from: 'subscribe',
          kitchenId: kitchen._id,
          planId: plan._id,
          planName: plan.name,
          kitchenName: kitchen.businessName,
        },
      });
    }
  };

  // Favorites tracking (loaded from backend if logged-in customer)
  const [favorites, setFavorites] = useState({});

  useEffect(() => {
    if (user && isCustomer) {
      api.get('/customer/saved-kitchens')
        .then((res) => {
          const ids = res.data?.savedKitchenIds || [];
          const favMap = {};
          ids.forEach((id) => {
            favMap[id] = true;
          });
          setFavorites(favMap);
        })
        .catch((err) => {
          console.error('Failed to load saved favorites:', err);
        });
    } else {
      setFavorites({});
    }
  }, [user, isCustomer]);

  const toggleFavorite = async (id, e) => {
    e.stopPropagation();
    if (!user || !isCustomer) {
      navigate('/login', {
        state: { from: 'favorite', message: 'Please log in to save kitchens to your favorites.' }
      });
      return;
    }

    const previousState = Boolean(favorites[id]);
    // Optimistic UI update
    setFavorites((prev) => ({
      ...prev,
      [id]: !previousState,
    }));

    try {
      await api.post(`/customer/saved-kitchens/${id}/toggle`);
    } catch (err) {
      console.error('Failed to toggle saved kitchen:', err);
      // Revert on failure
      setFavorites((prev) => ({
        ...prev,
        [id]: previousState,
      }));
    }
  };

  // Fetch cities once on mount
  useEffect(() => {
    api.get('/kitchens/cities')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setCities(res.data.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load cities:', err);
      });
  }, []);

  // Fetch kitchens with debounce on search
  const fetchKitchens = useCallback((targetPage = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    const params = {
      page: targetPage,
      limit: 8,
    };

    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (selectedCity && selectedCity !== 'ALL') params.city = selectedCity;
    if (selectedDiet && selectedDiet !== 'ALL') params.foodType = selectedDiet;

    api.get('/kitchens', { params })
      .then((res) => {
        const resultKitchens = res.data?.data || [];
        if (append) {
          setKitchens((prev) => [...prev, ...resultKitchens]);
        } else {
          setKitchens(resultKitchens);
        }
        setTotalPages(res.data?.pages || 1);
        setPage(targetPage);
        setLoading(false);
        setLoadingMore(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load tiffin providers');
        setLoading(false);
        setLoadingMore(false);
      });
  }, [searchTerm, selectedCity, selectedDiet]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchKitchens(1, false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCity, selectedDiet, fetchKitchens]);

  // Handle Load More
  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      fetchKitchens(page + 1, true);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCity('ALL');
    setSelectedDiet('ALL');
  };

  return (
    <section id="subscription" className="py-20 lg:py-28 bg-[#f8fafd] relative overflow-hidden scroll-mt-16">
      
      {/* Decorative leaf shapes matching Hero & HowItWorks */}
      <div className="absolute top-10 left-6 w-24 h-24 opacity-25 pointer-events-none text-blue-300">
        <svg viewBox="0 0 100 100" fill="currentColor">
          <path d="M10,80 Q30,10 80,10 Q90,50 30,85 Z" />
        </svg>
      </div>
      <div className="absolute top-44 right-8 w-20 h-20 opacity-20 pointer-events-none text-blue-400">
        <svg viewBox="0 0 100 100" fill="currentColor">
          <path d="M20,90 Q40,20 90,20 Q100,60 40,95 Z" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ================= SECTION HEADER ================= */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          {/* Top Pill */}
          <span className="inline-block bg-blue-100/80 text-blue-700 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-3.5 shadow-2xs">
            EXPLORE TIFFIN SERVICES
          </span>
          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Discover Trusted <span className="text-blue-600">Tiffin Providers</span>
          </h2>
          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Browse verified tiffin service providers near you. Compare plans, menus and choose the one that fits your lifestyle and taste.
          </p>
        </div>

        {/* ================= SEARCH & FILTER BAR ================= */}
        <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-xl shadow-slate-200/50 border border-slate-100 max-w-5xl mx-auto mb-12">
          <div className="flex flex-col lg:flex-row items-center gap-3">
            
            {/* Search Input Box */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by kitchen name, area or locality..."
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 border border-slate-200/80 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* City Dropdown Filter */}
            <div className="relative w-full lg:w-48 shrink-0">
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full appearance-none pl-9 pr-8 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200/80 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 cursor-pointer transition-all"
                >
                  <option value="ALL">All Cities</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  {/* Default fallback city if list is empty */}
                  {cities.length === 0 && <option value="Ahmedabad">Ahmedabad</option>}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Diet Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none shrink-0">
              {/* All Kitchens */}
              <button
                type="button"
                onClick={() => setSelectedDiet('ALL')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedDiet === 'ALL'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                All Kitchens
              </button>

              {/* Pure Veg */}
              <button
                type="button"
                onClick={() => setSelectedDiet('VEG')}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  selectedDiet === 'VEG'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200/60'
                }`}
              >
                <span>🌱</span>
                <span>Pure Veg</span>
              </button>

              {/* Non-Veg */}
              <button
                type="button"
                onClick={() => setSelectedDiet('NON_VEG')}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  selectedDiet === 'NON_VEG'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                    : 'bg-rose-50 hover:bg-rose-100/80 text-rose-800 border border-rose-200/60'
                }`}
              >
                <span>🍗</span>
                <span>Non-Veg</span>
              </button>

              {/* Veg & Non-Veg */}
              <button
                type="button"
                onClick={() => setSelectedDiet('BOTH')}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  selectedDiet === 'BOTH'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                    : 'bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-200/60'
                }`}
              >
                <span>🥗</span>
                <span>Veg & Non-Veg</span>
              </button>
            </div>

          </div>
        </div>

        {/* ================= PROVIDERS CARDS GRID ================= */}
        {loading ? (
          /* Skeletons while loading */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm animate-pulse space-y-4">
                <div className="aspect-[16/10] bg-slate-200 rounded-2xl w-full" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-4/5" />
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <div className="h-5 bg-slate-200 rounded w-1/3" />
                  <div className="h-8 bg-slate-200 rounded-xl w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="bg-white rounded-3xl p-12 text-center max-w-lg mx-auto border border-red-100 shadow-sm">
            <p className="text-red-600 font-bold mb-2">Failed to load kitchens</p>
            <p className="text-xs text-slate-500 mb-6">{error}</p>
            <button
              onClick={() => fetchKitchens(1, false)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-full text-xs shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : kitchens.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto border border-slate-200/80 shadow-md">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No tiffin providers found</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              We couldn't find any verified kitchens matching your current filters. Try expanding your search or selecting another city.
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {kitchens.map((kitchen, idx) => {
              const cardImage = kitchen.imageUrl && kitchen.imageUrl.trim().length > 5
                ? kitchen.imageUrl
                : TIFFIN_HUB_DEFAULT_IMAGE;

              const isFav = !!favorites[kitchen._id];

              return (
                <div
                  key={kitchen._id}
                  className="group bg-white rounded-3xl border border-slate-200/80 shadow-md shadow-slate-100 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    {/* Top Banner Image with Badges */}
                    <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                      <img
                        src={cardImage}
                        alt={kitchen.businessName}
                        onError={(e) => {
                          e.target.src = TIFFIN_HUB_DEFAULT_IMAGE;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

                      {/* Top-Left Verified & Status Pill */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                        <div className="bg-emerald-500/95 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </div>
                        {(kitchen.isAcceptingOrders === false || kitchen.operatingStatus === 'BUSY') && (
                          <div className="bg-amber-600/95 backdrop-blur-xs text-white text-[10px] font-extrabold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                            <span>🔴 At Capacity</span>
                          </div>
                        )}
                      </div>

                      {/* Top-Right Favorite Button */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(kitchen._id, e)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-500 hover:text-red-500 flex items-center justify-center shadow-md transition-all cursor-pointer"
                        aria-label="Save to favorites"
                      >
                        <Heart
                          className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-slate-500'}`}
                        />
                      </button>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-4 sm:p-5 space-y-3">
                      
                      {/* Kitchen Avatar + Title + Rating */}
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white font-extrabold text-base shadow-sm shadow-amber-500/20 shrink-0">
                          {kitchen.businessName ? kitchen.businessName.charAt(0).toUpperCase() : 'K'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                              {kitchen.businessName}
                            </h3>
                            {/* Rating */}
                            <div className="flex items-center text-amber-500 font-bold text-xs gap-1 shrink-0">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>
                                {kitchen.reviewsCount > 0
                                  ? Number(kitchen.rating || 0).toFixed(1)
                                  : 'New'}
                              </span>
                              {kitchen.reviewsCount > 0 && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                  ({kitchen.reviewsCount})
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Location */}
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {kitchen.address ? `${kitchen.address}, ` : ''}{kitchen.city}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bio Description */}
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed min-h-[32px]">
                        {kitchen.description && kitchen.description.trim().length > 0
                          ? kitchen.description
                          : 'Fresh home-style meals with authentic Indian taste and pure ingredients.'}
                      </p>

                      {/* Diet Badge & Meals Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {/* Diet Tag */}
                        {kitchen.foodType === 'VEG' ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-100">
                            Pure Veg
                          </span>
                        ) : kitchen.foodType === 'BOTH' ? (
                          <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-100">
                            Veg & Non-Veg
                          </span>
                        ) : (
                          <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-md border border-rose-100">
                            Non-Veg
                          </span>
                        )}

                        {/* Meals Tags */}
                        {(kitchen.availableMeals || ['Lunch', 'Dinner']).map((m) => (
                          <span
                            key={m}
                            className="text-[10px] bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-md border border-blue-100/60"
                          >
                            {m}
                          </span>
                        ))}
                      </div>

                    </div>
                  </div>

                  {/* Card Bottom: Price + View Menu Button */}
                  <div className="p-4 sm:p-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      {kitchen.startingPrice !== null && kitchen.startingPrice !== undefined ? (
                        <>
                          <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                            Plans from
                          </span>
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-base font-extrabold text-blue-600">
                              ₹{kitchen.startingPrice.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {kitchen.startingPlanDuration === 30
                                ? '/mo'
                                : kitchen.startingPlanDuration
                                ? `/${kitchen.startingPlanDuration}d`
                                : '/plan'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div>
                          <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                            Menu Pricing
                          </span>
                          <span className="text-xs font-semibold text-slate-600">
                            Plans coming soon
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedKitchenId(kitchen._id)}
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-3.5 py-2.5 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-100 cursor-pointer ${
                        kitchen.isAcceptingOrders === false || kitchen.operatingStatus === 'BUSY'
                          ? 'bg-slate-800 hover:bg-slate-900 text-white shadow-slate-800/20'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30'
                      }`}
                    >
                      <span>
                        {kitchen.isAcceptingOrders === false || kitchen.operatingStatus === 'BUSY'
                          ? 'View Menu (Paused)'
                          : 'View Menu & Plans'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* ================= PAGINATION: VIEW MORE PROVIDERS ================= */}
        {!loading && page < totalPages && (
          <div className="mt-14 text-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 border border-slate-200 font-bold px-8 py-3 rounded-full shadow-sm hover:border-blue-300 transition-all cursor-pointer text-sm"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Loading more kitchens...</span>
                </>
              ) : (
                <>
                  <span>View More Providers</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

      </div>

      {/* ================= KITCHEN DETAIL & MENU MODAL ================= */}
      {selectedKitchenId && (
        <KitchenDetailModal
          kitchenId={selectedKitchenId}
          onClose={() => setSelectedKitchenId(null)}
          onSelectPlan={handleSelectPlan}
        />
      )}

      {/* ================= STEP 3 & 4: SUBSCRIBE / CHECKOUT & SUCCESS MODAL ================= */}
      {subscribingPlan && (
        <SubscribeModal
          plan={subscribingPlan.plan}
          kitchen={subscribingPlan.kitchen}
          onClose={() => setSubscribingPlan(null)}
          existingSubscription={subscribingPlan.existingPendingSub}
        />
      )}

    </section>
  );
}
