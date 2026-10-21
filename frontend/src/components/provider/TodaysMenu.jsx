import React, { useState } from 'react';
import {
  Calendar,
  Sun,
  Moon,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Info,
} from 'lucide-react';
import { INITIAL_MENU_DATA, DAYS_OF_WEEK } from './WeeklyMenu';

export default function TodaysMenu({
  onEditMenu,
  onEditMenuClick,
  menuData = INITIAL_MENU_DATA,
}) {
  // Determine current day of week (e.g. "Monday")
  const todayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
  const dayMapping = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const defaultDay = dayMapping[todayIndex] || 'Monday';

  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const [dayDropdownOpen, setDayDropdownOpen] = useState(false);

  const handleEditClick = (mealType) => {
    const handler = onEditMenu || onEditMenuClick;
    if (handler) {
      handler(selectedDay, mealType);
    }
  };

  // Case-insensitive lookup helper to match "Wednesday" or "WEDNESDAY"
  const getDayData = (day) => {
    if (!menuData) return {};
    if (menuData[day]) return menuData[day];
    const key = Object.keys(menuData).find(
      (k) => k.toLowerCase() === day.toLowerCase()
    );
    return key ? menuData[key] : {};
  };

  const dayMenu = getDayData(selectedDay) || INITIAL_MENU_DATA[selectedDay] || INITIAL_MENU_DATA.Monday || {};

  const mealRows = [
    {
      mealType: 'Breakfast',
      icon: Sun,
      iconContainerStyle: 'bg-amber-50 border border-amber-200/70 text-amber-500',
      timing: dayMenu.breakfast?.timing || '8:00 AM - 10:00 AM',
      items: dayMenu.breakfast?.items || [],
    },
    {
      mealType: 'Lunch',
      icon: Sun,
      iconContainerStyle: 'bg-emerald-50 border border-emerald-200/70 text-emerald-500',
      timing: dayMenu.lunch?.timing || '12:30 PM - 2:00 PM',
      items: dayMenu.lunch?.items || [],
    },
    {
      mealType: 'Dinner',
      icon: Moon,
      iconContainerStyle: 'bg-purple-50 border border-purple-200/70 text-purple-500',
      timing: dayMenu.dinner?.timing || '7:30 PM - 9:00 PM',
      items: dayMenu.dinner?.items || [],
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
      <div>
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Today's Menu
            </h3>

            {/* Day Dropdown Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDayDropdownOpen(!dayDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-[11px] font-bold text-slate-700 uppercase tracking-wider transition-colors cursor-pointer"
              >
                <span>{selectedDay}</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {dayDropdownOpen && (
                <div className="absolute left-0 mt-1 w-40 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        setSelectedDay(day);
                        setDayDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        selectedDay === day
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Edit Weekly Menu Shortcut */}
          <button
            type="button"
            onClick={() => handleEditClick()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer group"
          >
            <span>Edit weekly menu</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Meal Items List */}
        <div className="space-y-3 mb-6">
          {mealRows.map((meal) => {
            const Icon = meal.icon;
            const hasItems = meal.items && meal.items.length > 0;
            const itemNames = hasItems
              ? meal.items.map((i) => i.name).join(', ')
              : 'No items configured for this meal';

            return (
              <div
                key={meal.mealType}
                onClick={() => handleEditClick(meal.mealType.toLowerCase())}
                className="group flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Themed Sun/Moon Icon Container (Replaces food picture) */}
                  <div
                    className={`w-12 h-12 rounded-2xl ${meal.iconContainerStyle} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-6 h-6 stroke-[2.2]" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-slate-800">
                        {meal.mealType}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        ({meal.timing})
                      </span>
                    </div>
                    <p
                      className={`text-xs leading-relaxed line-clamp-1 ${
                        hasItems
                          ? 'text-slate-600 font-medium'
                          : 'text-slate-400 italic'
                      }`}
                    >
                      {itemNames}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Info Note */}
      <div className="pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-500 leading-relaxed">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <span>
          This is your fixed weekly menu for <strong className="font-semibold text-slate-700">{selectedDay}</strong>. The same menu will be shown to customers for every {selectedDay}.
        </span>
      </div>
    </div>
  );
}
