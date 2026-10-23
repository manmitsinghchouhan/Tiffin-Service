import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Pencil,
  Plus,
  ArrowLeft,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import AddItemModal from './AddItemModal';
import EditMealModal from './EditMealModal';
import ManageMenuModal from './ManageMenuModal';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const INITIAL_MENU_DATA = {
  Monday: {
    breakfast: { timing: '8:00 AM - 10:00 AM', items: [] },
    lunch: { timing: '12:00 PM - 01:30 PM', items: [] },
    dinner: { timing: '07:30 PM - 09:00 PM', items: [] },
  },
  Tuesday: {
    breakfast: { timing: '8:00 AM - 10:00 AM', items: [] },
    lunch: { timing: '12:00 PM - 01:30 PM', items: [] },
    dinner: { timing: '07:30 PM - 09:00 PM', items: [] },
  },
  Wednesday: {
    breakfast: { timing: '8:00 AM - 10:00 AM', items: [] },
    lunch: { timing: '12:00 PM - 01:30 PM', items: [] },
    dinner: { timing: '07:30 PM - 09:00 PM', items: [] },
  },
  Thursday: {
    breakfast: { timing: '8:00 AM - 10:00 AM', items: [] },
    lunch: { timing: '12:00 PM - 01:30 PM', items: [] },
    dinner: { timing: '07:30 PM - 09:00 PM', items: [] },
  },
  Friday: {
    breakfast: { timing: '8:00 AM - 10:00 AM', items: [] },
    lunch: { timing: '12:00 PM - 01:30 PM', items: [] },
    dinner: { timing: '07:30 PM - 09:00 PM', items: [] },
  },
  Saturday: {
    breakfast: { timing: '8:00 AM - 10:00 AM', items: [] },
    lunch: { timing: '12:00 PM - 01:30 PM', items: [] },
    dinner: { timing: '07:30 PM - 09:00 PM', items: [] },
  },
  Sunday: {
    breakfast: { timing: '8:30 AM - 10:30 AM', items: [] },
    lunch: { timing: '12:00 PM - 01:30 PM', items: [] },
    dinner: { timing: '07:30 PM - 09:00 PM', items: [] },
  },
};

export default function WeeklyMenu({
  onNavigateBack,
  menuData = INITIAL_MENU_DATA,
  onMenuChange,
  onToast,
  isSaving = false,
  isLoading = false,
}) {
  const { providerProfile } = useAuth();
  const orderTiming = providerProfile?.settings?.orderTiming || {};
  const defaultLunchTiming = orderTiming.lunchDeliveryWindow || '12:00 PM - 01:30 PM';
  const defaultDinnerTiming = orderTiming.dinnerDeliveryWindow || '07:30 PM - 09:00 PM';

  const [selectedDay, setSelectedDay] = useState('Monday');

  // Modal State
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [editMealModalOpen, setEditMealModalOpen] = useState(false);
  const [manageMenuModalOpen, setManageMenuModalOpen] = useState(false);
  const [targetMealType, setTargetMealType] = useState('breakfast');

  const currentDayData = menuData[selectedDay] || {
    breakfast: { timing: '8:00 AM - 10:00 AM', items: [] },
    lunch: { timing: defaultLunchTiming, items: [] },
    dinner: { timing: defaultDinnerTiming, items: [] },
  };

  const mealCards = [
    {
      type: 'breakfast',
      title: 'Breakfast',
      timing: currentDayData.breakfast?.timing || '8:00 AM - 10:00 AM',
      icon: Sun,
      iconBg: 'bg-blue-50 border border-blue-100 text-blue-500',
      data: currentDayData.breakfast,
    },
    {
      type: 'lunch',
      title: 'Lunch',
      timing: currentDayData.lunch?.timing || defaultLunchTiming,
      icon: Sun,
      iconBg: 'bg-emerald-50 border border-emerald-100 text-emerald-500',
      data: currentDayData.lunch,
    },
    {
      type: 'dinner',
      title: 'Dinner',
      timing: currentDayData.dinner?.timing || defaultDinnerTiming,
      icon: Moon,
      iconBg: 'bg-purple-50 border border-purple-100 text-purple-500',
      data: currentDayData.dinner,
    },
  ];

  // Handler: Open Add Items Modal (supports both onOpenAddItem(day, mealType) and handleOpenAddItems(mealType))
  const handleOpenAddItems = (mealTypeOrDay, maybeMealType) => {
    if (maybeMealType) {
      setSelectedDay(mealTypeOrDay);
      setTargetMealType(maybeMealType.toLowerCase());
    } else if (mealTypeOrDay) {
      setTargetMealType(mealTypeOrDay.toLowerCase());
    }
    setAddItemModalOpen(true);
  };

  // Handler: Open Edit Meal Modal
  const handleOpenEditMeal = (mealType) => {
    setTargetMealType((mealType || 'breakfast').toLowerCase());
    setEditMealModalOpen(true);
  };

  // Handler: Add Item to day & meal
  const handleAddItem = (day, mealType, newItem) => {
    const validMeal = (mealType || 'breakfast').toLowerCase();
    if (!['breakfast', 'lunch', 'dinner'].includes(validMeal)) {
      console.warn('Blocked invalid mealType in handleAddItem:', mealType);
      return;
    }

    const updated = JSON.parse(JSON.stringify(menuData));
    if (!updated[day]) updated[day] = {};
    if (!updated[day][validMeal]) {
      updated[day][validMeal] = { timing: '12:00 PM - 1:00 PM', items: [] };
    }
    if (!updated[day][validMeal].items) {
      updated[day][validMeal].items = [];
    }
    updated[day][validMeal].items.push(newItem);

    if (onMenuChange) {
      onMenuChange(updated);
    }
    onToast?.(`Added "${newItem.name}" to ${day}'s ${validMeal.charAt(0).toUpperCase() + validMeal.slice(1)}!`);
  };

  // Handler: Update Meal (timing & items)
  const handleUpdateMeal = (day, mealType, updatedMealData) => {
    const validMeal = (mealType || 'breakfast').toLowerCase();
    if (!['breakfast', 'lunch', 'dinner'].includes(validMeal)) {
      console.warn('Blocked invalid mealType in handleUpdateMeal:', mealType);
      return;
    }

    const updated = JSON.parse(JSON.stringify(menuData));
    if (!updated[day]) updated[day] = {};
    updated[day][validMeal] = {
      ...updated[day][validMeal],
      ...updatedMealData,
    };

    if (onMenuChange) {
      onMenuChange(updated);
    }
    onToast?.(`Updated ${day}'s ${validMeal.charAt(0).toUpperCase() + validMeal.slice(1)} successfully!`);
  };

  // Handler: Copy Day Menu
  const handleCopyDay = async (sourceDay, targetDays) => {
    try {
      const res = await api.post('/provider/menu/copy-day', {
        sourceDay,
        targetDays,
      });
      if (res.data?.success && res.data?.data) {
        if (onMenuChange) {
          onMenuChange(res.data.data);
        }
        onToast?.(`Copied ${sourceDay}'s menu to ${targetDays.length} day(s)!`);
        return;
      }
    } catch (e) {
      console.warn('Backend copy-day API call failed, using local update', e);
    }

    const updated = JSON.parse(JSON.stringify(menuData));
    const sourceData = updated[sourceDay];

    targetDays.forEach((target) => {
      updated[target] = JSON.parse(JSON.stringify(sourceData));
    });

    if (onMenuChange) {
      onMenuChange(updated);
    }
    onToast?.(`Copied ${sourceDay}'s menu to ${targetDays.length} day(s)!`);
  };

  // Handler: Clear Day Menu
  const handleClearDay = (day) => {
    const updated = JSON.parse(JSON.stringify(menuData));
    if (updated[day]) {
      updated[day] = {
        breakfast: { timing: '8:00 AM - 10:00 AM', items: [] },
        lunch: { timing: '12:30 PM - 2:00 PM', items: [] },
        dinner: { timing: '7:30 PM - 9:00 PM', items: [] },
      };
    }
    if (onMenuChange) {
      onMenuChange(updated);
    }
    onToast?.(`Cleared all meals for ${day}.`);
  };

  // Handler: Reset All to Default
  const handleResetMenu = async () => {
    try {
      const res = await api.post('/provider/menu/reset');
      if (res.data?.success && res.data?.data) {
        if (onMenuChange) {
          onMenuChange(res.data.data);
        }
        onToast?.(`Reset entire weekly menu to default schedule.`);
        return;
      }
    } catch (e) {
      console.warn('Backend reset API call failed, falling back to local defaults', e);
    }

    if (onMenuChange) {
      onMenuChange(INITIAL_MENU_DATA);
    }
    onToast?.(`Reset entire weekly menu to default sample items.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb matching reference image */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <button
          type="button"
          onClick={onNavigateBack}
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Workspace</span>
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-slate-800">Weekly Menu</span>
      </div>

      {/* Headline & Subtitle & Cloud Status & Manage Menu Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Weekly Menu</span>
            <span className="text-2xl">🌿</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Set your weekly tiffin menu. The same menu will be served every week until you update it.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isSaving ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span>Saving changes...</span>
            </div>
          ) : (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Saved to cloud</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setManageMenuModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer self-start sm:self-auto"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Manage Menu</span>
          </button>
        </div>
      </div>

      {/* Seven Day Tabs matching Image 1 Reference */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {DAYS_OF_WEEK.map((day) => {
          const isActive = selectedDay === day;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`px-6 py-2.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Three Meal Cards: Breakfast, Lunch, Dinner */}
      <div className="space-y-4">
        {mealCards.map((meal) => {
          const Icon = meal.icon;
          const items = meal.data?.items || [];

          return (
            <div
              key={meal.type}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200"
            >
              {/* Meal Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl ${meal.iconBg} flex items-center justify-center shrink-0 shadow-2xs`}>
                    <Icon className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900 tracking-tight">
                        {meal.title}
                      </h2>
                      <span className="text-xs text-slate-400 font-normal">
                        ({meal.timing})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top-Right Action Buttons */}
                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleOpenEditMeal(meal.type)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenAddItems(meal.type)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Items</span>
                  </button>
                </div>
              </div>

              {/* Food Items Row / Grid */}
              <div className="pt-5">
                {items.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50/60 border border-dashed border-slate-200 rounded-2xl">
                    <p className="text-xs font-semibold text-slate-600">
                      No dishes added yet for {selectedDay}'s {meal.title}.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click "+ Add Items" to add your sabzi, dal, roti, or breakfast dishes.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3.5 p-2 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50/70 transition-all"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 rounded-2xl object-cover shadow-xs shrink-0"
                          onError={(e) => {
                            e.target.src =
                              'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {item.name}
                          </h4>
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold mt-0.5 ${
                              item.diet === 'Veg' ? 'text-emerald-600' : 'text-amber-600'
                            }`}
                          >
                            <span>{item.diet === 'Veg' ? '🌱' : '🍗'}</span>
                            <span>({item.diet})</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <AddItemModal
        isOpen={addItemModalOpen}
        onClose={() => setAddItemModalOpen(false)}
        day={selectedDay}
        mealType={targetMealType}
        onAddItem={handleAddItem}
      />

      <EditMealModal
        isOpen={editMealModalOpen}
        onClose={() => setEditMealModalOpen(false)}
        day={selectedDay}
        mealType={targetMealType}
        mealData={currentDayData[targetMealType]}
        onUpdateMeal={handleUpdateMeal}
        onOpenAddItem={handleOpenAddItems}
      />

      <ManageMenuModal
        isOpen={manageMenuModalOpen}
        onClose={() => setManageMenuModalOpen(false)}
        currentDay={selectedDay}
        onCopyDay={handleCopyDay}
        onClearDay={handleClearDay}
        onResetMenu={handleResetMenu}
      />
    </div>
  );
}
