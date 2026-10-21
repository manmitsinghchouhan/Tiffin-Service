import React, { useState } from 'react';
import {
  X,
  Plus,
  Check,
  Utensils,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';

const PRESET_FOODS = [
  { name: 'Poha', diet: 'Veg', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80' },
  { name: 'Chai', diet: 'Veg', image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&auto=format&fit=crop&q=80' },
  { name: 'Fresh Fruits', diet: 'Veg', image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=300&auto=format&fit=crop&q=80' },
  { name: 'Aloo Paratha', diet: 'Veg', image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&auto=format&fit=crop&q=80' },
  { name: 'Dal Tadka', diet: 'Veg', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&auto=format&fit=crop&q=80' },
  { name: 'Roti / Chapati', diet: 'Veg', image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=300&auto=format&fit=crop&q=80' },
  { name: 'Mix Sabzi', diet: 'Veg', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&auto=format&fit=crop&q=80' },
  { name: 'Paneer Curry', diet: 'Veg', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&auto=format&fit=crop&q=80' },
  { name: 'Green Salad', diet: 'Veg', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&auto=format&fit=crop&q=80' },
  { name: 'Jeera Rice', diet: 'Veg', image: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=300&auto=format&fit=crop&q=80' },
  { name: 'Egg Curry', diet: 'Non-Veg', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80' },
  { name: 'Chicken Curry', diet: 'Non-Veg', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&auto=format&fit=crop&q=80' },
];

export default function AddItemModal({
  isOpen,
  onClose,
  day,
  mealType,
  onAddItem,
}) {
  const [itemName, setItemName] = useState('');
  const [diet, setDiet] = useState('Veg');
  const [imageUrl, setImageUrl] = useState('');
  const [customImage, setCustomImage] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  if (!isOpen) return null;

  const mealTitle = mealType ? mealType.charAt(0).toUpperCase() + mealType.slice(1) : '';

  const handleSelectPreset = (preset) => {
    setItemName(preset.name);
    setDiet(preset.diet);
    setImageUrl(preset.image);
    setCustomImage(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    const finalImage =
      imageUrl.trim() ||
      (diet === 'Veg'
        ? 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&auto=format&fit=crop&q=80');

    const newItem = {
      id: `${day.toLowerCase()}-${mealType}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: itemName.trim(),
      diet: diet,
      image: finalImage,
    };

    onAddItem(day, mealType, newItem);
    setAddedCount((c) => c + 1);

    // Reset inputs for quick consecutive addition
    setItemName('');
    setImageUrl('');
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
              Add Food Item
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Quick Presets Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Popular Dishes</span>
              </label>
              <span className="text-[11px] text-slate-400">Click to autofill</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-slate-50 border border-slate-200/70 rounded-2xl">
              {PRESET_FOODS.map((food, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectPreset(food)}
                  className={`text-xs px-2.5 py-1 rounded-xl font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    itemName === food.name
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200/60'
                  }`}
                >
                  <span className={food.diet === 'Veg' ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}>
                    {food.diet === 'Veg' ? '🌱' : '🍗'}
                  </span>
                  <span>{food.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Item Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Poha, Dal Tadka, Aloo Paratha"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Dietary Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Dietary Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDiet('Veg')}
                className={`py-2 px-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  diet === 'Veg'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>🌱 Pure Veg</span>
                {diet === 'Veg' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>

              <button
                type="button"
                onClick={() => setDiet('Non-Veg')}
                className={`py-2 px-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  diet === 'Non-Veg'
                    ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>🍗 Non-Veg</span>
                {diet === 'Non-Veg' && <Check className="w-3.5 h-3.5 text-amber-600" />}
              </button>
            </div>
          </div>

          {/* Photo Preview / Custom URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Item Photo
              </label>
              <button
                type="button"
                onClick={() => setCustomImage(!customImage)}
                className="text-[11px] text-blue-600 hover:underline font-semibold"
              >
                {customImage ? 'Use auto thumbnail' : 'Custom image URL'}
              </button>
            </div>

            {customImage ? (
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            ) : (
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-2xl border border-slate-200/70">
                <img
                  src={
                    imageUrl ||
                    (diet === 'Veg'
                      ? 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&auto=format&fit=crop&q=80'
                      : 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&auto=format&fit=crop&q=80')
                  }
                  alt="Preview"
                  className="w-12 h-12 rounded-xl object-cover shadow-xs shrink-0"
                />
                <div className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700 block">
                    {itemName || 'Selected Dish Preview'}
                  </span>
                  <span>A delicious photo thumbnail will be shown on customer menu</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400 font-medium">
              {addedCount > 0 ? `✓ Added ${addedCount} item(s) so far` : ''}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                {addedCount > 0 ? 'Done' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={!itemName.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Save Item</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
