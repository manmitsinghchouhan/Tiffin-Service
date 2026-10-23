import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Clock,
  Check,
  Save,
  Plus,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function EditMealModal({
  isOpen,
  onClose,
  day,
  mealType,
  mealData,
  onUpdateMeal,
  onOpenAddItem,
}) {
  const { providerProfile } = useAuth();
  const kitchenFoodType = providerProfile?.foodType || 'BOTH';

  const [timing, setTiming] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (mealData) {
      setTiming(mealData.timing || '');
      setItems(mealData.items ? JSON.parse(JSON.stringify(mealData.items)) : []);
    }
  }, [mealData, isOpen]);

  if (!isOpen) return null;

  const mealTitle = mealType ? mealType.charAt(0).toUpperCase() + mealType.slice(1) : '';

  const handleItemNameChange = (idx, newName) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[idx].name = newName;
      return copy;
    });
  };

  const handleItemDietToggle = (idx) => {
    if (kitchenFoodType !== 'BOTH') return; // Locked if VEG or NON_VEG
    setItems((prev) => {
      const copy = [...prev];
      copy[idx].diet = copy[idx].diet === 'Veg' ? 'Non-Veg' : 'Veg';
      return copy;
    });
  };

  const handleRemoveItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    const sanitizedItems = items
      .filter((it) => it.name.trim() !== '')
      .map((it) => ({
        ...it,
        diet:
          kitchenFoodType === 'VEG'
            ? 'Veg'
            : kitchenFoodType === 'NON_VEG'
            ? 'Non-Veg'
            : it.diet,
      }));

    onUpdateMeal(day, mealType, {
      timing: timing.trim(),
      items: sanitizedItems,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 mb-1">
              <span>{day}</span>
              <span>•</span>
              <span>{mealTitle}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Edit Meal & Items
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Meal Timing Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Serving / Delivery Window</span>
            </label>
            <input
              type="text"
              value={timing}
              onChange={(e) => setTiming(e.target.value)}
              placeholder="e.g. 8:00 AM - 10:00 AM"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Displayed to customers as the expected dispatch or meal delivery schedule.
            </p>
          </div>

          {/* Items List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">
                Dishes in this Meal ({items.length})
              </label>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenAddItem) onOpenAddItem(day, mealType);
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add new item</span>
              </button>
            </div>

            {items.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-600">No dishes in this meal</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Click "Add new item" above to add dishes.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl group hover:border-slate-300 transition-all"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-11 h-11 rounded-xl object-cover shadow-xs shrink-0"
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&auto=format&fit=crop&q=80';
                      }}
                    />

                    {/* Item Name Input */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemNameChange(idx, e.target.value)}
                        className="w-full px-2.5 py-1 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Veg / Non-Veg Toggle or Locked Badge */}
                    {kitchenFoodType === 'BOTH' ? (
                      <button
                        type="button"
                        onClick={() => handleItemDietToggle(idx)}
                        title="Click to toggle Veg / Non-Veg"
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                          item.diet === 'Veg'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {item.diet === 'Veg' ? '🌱 Veg' : '🍗 Non-Veg'}
                      </button>
                    ) : (
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                          item.diet === 'Veg'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {item.diet === 'Veg' ? '🌱 Veg' : '🍗 Non-Veg'}
                      </span>
                    )}

                    {/* Delete Item Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
