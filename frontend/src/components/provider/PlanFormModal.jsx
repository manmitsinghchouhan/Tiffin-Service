import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Check,
  Sparkles,
  AlertCircle,
  Loader2,
  Calendar,
  UtensilsCrossed,
  Tag,
  Image as ImageIcon,
  Link2
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const FEATURE_SUGGESTIONS = [
  '4 Phulkas / Rotis',
  'Dal Tadka / Dal Fry',
  'Seasonal Sabzi',
  'Steamed Basmati Rice',
  'Fresh Green Salad',
  'Curd / Raita',
  'Pickle & Papad',
  'Sweet / Dessert',
  'Sambar & Chutney',
  'Egg Curry',
  'Chicken Curry'
];

const PLAN_PRESET_IMAGES = [
  {
    title: 'Veg Thali',
    url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&auto=format&fit=crop&q=80',
    type: 'Veg'
  },
  {
    title: 'Dal & Phulkas',
    url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&auto=format&fit=crop&q=80',
    type: 'Veg'
  },
  {
    title: 'Paneer Curry',
    url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format&fit=crop&q=80',
    type: 'Veg'
  },
  {
    title: 'Idli & Sambhar',
    url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80',
    type: 'Veg'
  },
  {
    title: 'Parathas Meal',
    url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&auto=format&fit=crop&q=80',
    type: 'Veg'
  },
  {
    title: 'Non-Veg Thali',
    url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&auto=format&fit=crop&q=80',
    type: 'Non-Veg'
  }
];

export default function PlanFormModal({
  isOpen,
  onClose,
  planToEdit = null,
  onSaveSuccess,
  onToast
}) {
  const isEdit = Boolean(planToEdit && planToEdit._id);
  const { providerProfile } = useAuth();
  const kitchenFoodType = (providerProfile?.foodType || 'BOTH').toUpperCase();

  // Filter presets based on kitchen onboarding food type
  const availablePresetImages = PLAN_PRESET_IMAGES.filter((preset) => {
    if (kitchenFoodType === 'VEG') return preset.type === 'Veg';
    if (kitchenFoodType === 'NON_VEG') return preset.type === 'Non-Veg';
    return true;
  });

  const availableFeatureSuggestions = FEATURE_SUGGESTIONS.filter((sug) => {
    if (kitchenFoodType === 'VEG') {
      return !['Egg Curry', 'Chicken Curry'].includes(sug);
    }
    return true;
  });

  const defaultDiet = kitchenFoodType === 'NON_VEG' ? 'NON_VEG' : 'VEG';

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [mealType, setMealType] = useState('LUNCH');
  const [diet, setDiet] = useState(defaultDiet);
  const [deliveryDays, setDeliveryDays] = useState('ALL_DAYS');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);
  const [features, setFeatures] = useState([]);
  const [featureInput, setFeatureInput] = useState('');
  const [isSubscriptionAvailable, setIsSubscriptionAvailable] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Populate form if editing
  useEffect(() => {
    if (planToEdit) {
      setName(planToEdit.name || '');
      setDescription(planToEdit.description || '');
      setDurationDays(planToEdit.durationDays || 30);
      setMealType(planToEdit.mealType || 'LUNCH');
      
      let resolvedEditDiet = planToEdit.diet || 'VEG';
      if (kitchenFoodType === 'VEG') resolvedEditDiet = 'VEG';
      else if (kitchenFoodType === 'NON_VEG') resolvedEditDiet = 'NON_VEG';
      setDiet(resolvedEditDiet);

      setDeliveryDays(planToEdit.deliveryDays || 'ALL_DAYS');
      setPrice(planToEdit.price !== undefined ? String(planToEdit.price) : '');
      setImageUrl(planToEdit.imageUrl || '');
      setShowCustomUrlInput(Boolean(planToEdit.imageUrl && !PLAN_PRESET_IMAGES.some(p => p.url === planToEdit.imageUrl)));
      setFeatures(Array.isArray(planToEdit.features) ? [...planToEdit.features] : []);
      setIsSubscriptionAvailable(planToEdit.isSubscriptionAvailable !== false);
    } else {
      // Default clean slate for new plan
      setName('');
      setDescription('');
      setDurationDays(30);
      setMealType('LUNCH');
      setDiet(defaultDiet);
      setDeliveryDays('ALL_DAYS');
      setPrice('');
      const firstPreset = availablePresetImages[0] || PLAN_PRESET_IMAGES[0];
      setImageUrl(firstPreset ? firstPreset.url : '');
      setShowCustomUrlInput(false);
      setFeatures(
        kitchenFoodType === 'NON_VEG'
          ? ['4 Phulkas / Rotis', 'Chicken Curry', 'Steamed Basmati Rice', 'Fresh Green Salad']
          : ['4 Phulkas / Rotis', 'Dal Tadka', 'Seasonal Sabzi', 'Rice + Salad']
      );
      setIsSubscriptionAvailable(true);
    }
    setError(null);
  }, [planToEdit, isOpen, kitchenFoodType, defaultDiet]);

  if (!isOpen) return null;

  // Feature tag helpers
  const handleAddFeature = (fToAdd) => {
    const text = (fToAdd || featureInput).trim();
    if (!text) return;
    if (!features.includes(text)) {
      setFeatures((prev) => [...prev, text]);
    }
    setFeatureInput('');
  };

  const handleRemoveFeature = (idxToRemove) => {
    setFeatures((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a plan name');
      return;
    }

    const numPrice = Number(price);
    if (price === '' || isNaN(numPrice) || numPrice < 0) {
      setError('Please provide a valid price (greater than or equal to 0)');
      return;
    }

    let resolvedDiet = diet;
    if (kitchenFoodType === 'VEG') resolvedDiet = 'VEG';
    else if (kitchenFoodType === 'NON_VEG') resolvedDiet = 'NON_VEG';

    const payload = {
      name: name.trim(),
      description: description.trim(),
      durationDays: Number(durationDays) || 30,
      mealType,
      diet: resolvedDiet,
      deliveryDays,
      price: numPrice,
      imageUrl: imageUrl.trim(),
      features,
      isSubscriptionAvailable
    };

    try {
      setLoading(true);
      let res;
      if (isEdit) {
        res = await api.patch(`/provider/plans/${planToEdit._id}`, payload);
      } else {
        res = await api.post('/provider/plans', payload);
      }

      if (res.data?.success) {
        onToast?.(
          isEdit
            ? `Plan "${payload.name}" updated successfully!`
            : `New plan "${payload.name}" created successfully!`
        );
        onSaveSuccess?.(res.data.data, isEdit);
        onClose();
      }
    } catch (err) {
      console.error('Failed to save plan:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save tiffin plan';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Slide-over Right Panel (Matching Reference UI) */}
      <div className="relative w-full max-w-xl h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              {isEdit ? 'Edit Tiffin Plan' : 'Create New Tiffin Plan'}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isEdit
                ? 'Update pricing, meal windows, and features.'
                : 'Set up a new meal plan for your customers.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Plan Name */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800">
                Plan Name <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {name.length}/120
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Monthly Veg Lunch Plan"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800">
                Description
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {description.length}/500
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description about this plan (e.g. Fresh home-style meals delivered warm)..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs resize-none"
            />
          </div>

          {/* Plan Photo Selection (Issue 1 Implementation) */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Plan Cover Photo</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Link2 className="w-3 h-3" />
                <span>{showCustomUrlInput ? 'Pick preset photo' : 'Custom image URL'}</span>
              </button>
            </div>

            {/* Custom URL Input if toggled */}
            {showCustomUrlInput ? (
              <div>
                <input
                  type="url"
                  placeholder="Paste direct image URL (https://...)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
              </div>
            ) : (
              /* One-Click Dish Presets filtered by kitchen dietary preference */
              <div>
                <div className="grid grid-cols-3 gap-2">
                  {availablePresetImages.map((preset, idx) => {
                    const isSelected = imageUrl === preset.url;
                    return (
                      <div
                        key={idx}
                        onClick={() => setImageUrl(preset.url)}
                        className={`group relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all p-1 flex flex-col items-center text-center ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.title}
                          className="w-full h-12 object-cover rounded-lg"
                        />
                        <span className="text-[10px] font-bold text-slate-700 mt-1 truncate w-full">
                          {preset.title}
                        </span>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live Preview Box */}
            {imageUrl && (
              <div className="flex items-center gap-3 pt-2 border-t border-slate-200/60">
                <img
                  src={imageUrl}
                  alt="Plan Preview"
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                  onError={(e) => {
                    e.target.src = availablePresetImages[0]?.url || PLAN_PRESET_IMAGES[0].url;
                  }}
                />
                <div className="text-[11px] text-slate-500 min-w-0">
                  <span className="font-semibold text-slate-700 block truncate">
                    Selected Thumbnail
                  </span>
                  <span className="text-slate-400">
                    This photo will be showcased on your plan card and customer catalog.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Duration & Meal Type (2 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Duration <span className="text-red-500">*</span>
              </label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer font-medium"
              >
                <option value={7}>7 Days (Weekly)</option>
                <option value={15}>15 Days (Fortnightly)</option>
                <option value={30}>30 Days (Monthly)</option>
                <option value={60}>60 Days (2 Months)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Meal Type <span className="text-red-500">*</span>
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer font-medium"
              >
                <option value="BREAKFAST">Breakfast</option>
                <option value="LUNCH">Lunch</option>
                <option value="DINNER">Dinner</option>
                <option value="LUNCH_DINNER">Lunch & Dinner (2 Meals/Day)</option>
                <option value="ALL_MEALS">All Meals (Breakfast + Lunch + Dinner)</option>
              </select>
            </div>
          </div>

          {/* Diet & Delivery Days (2 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Diet <span className="text-red-500">*</span>
              </label>
              {kitchenFoodType === 'VEG' ? (
                <div>
                  <div className="w-full px-3.5 py-2.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>🌱</span> Veg (Pure Vegetarian)
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                      Profile Locked
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    Locked to Pure Veg kitchen onboarding selection
                  </p>
                </div>
              ) : kitchenFoodType === 'NON_VEG' ? (
                <div>
                  <div className="w-full px-3.5 py-2.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-800 font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>🍗</span> Non-Veg
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                      Profile Locked
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    Locked to Non-Veg kitchen onboarding selection
                  </p>
                </div>
              ) : (
                <select
                  value={diet}
                  onChange={(e) => setDiet(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer font-medium"
                >
                  <option value="VEG">🌱 Veg (Pure Vegetarian)</option>
                  <option value="NON_VEG">🍗 Non-Veg</option>
                  <option value="BOTH">🥗 Both (Veg & Non-Veg)</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Delivery Days
              </label>
              <select
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer font-medium"
              >
                <option value="ALL_DAYS">All Days (Monday - Sunday)</option>
                <option value="MON_TO_SAT">Monday to Saturday</option>
                <option value="WEEKDAYS_ONLY">Weekdays Only (Mon - Fri)</option>
              </select>
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Price (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                ₹
              </div>
              <input
                type="number"
                min={0}
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter plan price (e.g. 2400)"
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
              />
            </div>
          </div>

          {/* Key Features (Checklist items) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Key Features (Optional)
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                placeholder="Add a feature (e.g. 4 Phulkas, Dal Tadka)"
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => handleAddFeature()}
                className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="mb-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Quick Suggestions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availableFeatureSuggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleAddFeature(sug)}
                    className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Feature Tag Chips */}
            {features.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                {features.map((feat, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs"
                  >
                    <span>{feat}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="text-slate-400 hover:text-red-500 p-0.5 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Enable Subscription Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl cursor-pointer hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                checked={isSubscriptionAvailable}
                onChange={(e) => setIsSubscriptionAvailable(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">
                  Enable subscription for this plan
                </span>
                <span className="text-slate-500 text-[11px]">
                  Customers will be able to subscribe to this plan for recurring daily meal dispatches.
                </span>
              </div>
            </label>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-500/20 hover:shadow-lg transition-all cursor-pointer"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isEdit ? 'Save Changes' : 'Create Plan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
