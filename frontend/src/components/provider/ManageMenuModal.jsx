import React, { useState } from 'react';
import {
  X,
  Copy,
  RotateCcw,
  Trash2,
  Check,
  AlertTriangle,
  CalendarDays
} from 'lucide-react';

const ALL_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export default function ManageMenuModal({
  isOpen,
  onClose,
  currentDay,
  onCopyDay,
  onClearDay,
  onResetMenu,
}) {
  const [selectedTargetDays, setSelectedTargetDays] = useState(
    ALL_DAYS.filter((d) => d !== currentDay)
  );
  const [activeAction, setActiveAction] = useState('copy'); // 'copy' | 'clear' | 'reset'

  if (!isOpen) return null;

  const toggleDay = (d) => {
    setSelectedTargetDays((prev) =>
      prev.includes(d) ? prev.filter((item) => item !== d) : [...prev, d]
    );
  };

  const handleCopySubmit = () => {
    if (selectedTargetDays.length === 0) return;
    onCopyDay(currentDay, selectedTargetDays);
    onClose();
  };

  const handleClearSubmit = () => {
    onClearDay(currentDay);
    onClose();
  };

  const handleResetSubmit = () => {
    onResetMenu();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-0.5">
              Menu Operations
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Manage Weekly Menu
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-100 px-6 pt-3 gap-4">
          <button
            type="button"
            onClick={() => setActiveAction('copy')}
            className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
              activeAction === 'copy'
                ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Copy Day Menu
          </button>
          <button
            type="button"
            onClick={() => setActiveAction('clear')}
            className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
              activeAction === 'clear'
                ? 'text-red-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-red-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Clear Day
          </button>
          <button
            type="button"
            onClick={() => setActiveAction('reset')}
            className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
              activeAction === 'reset'
                ? 'text-amber-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-amber-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Reset Defaults
          </button>
        </div>

        {/* Action Content */}
        <div className="p-6">
          {activeAction === 'copy' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Copy all breakfast, lunch, and dinner items from{' '}
                <strong className="text-blue-600 font-bold">{currentDay}</strong> to other selected days of the week:
              </p>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Select Target Days:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_DAYS.filter((d) => d !== currentDay).map((day) => {
                    const isSelected = selectedTargetDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-400 text-blue-700 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>{day}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCopySubmit}
                  disabled={selectedTargetDays.length === 0}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-sm transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy to {selectedTargetDays.length} Days</span>
                </button>
              </div>
            </div>
          )}

          {activeAction === 'clear' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Clear Menu for {currentDay}?
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  This will remove all items from Breakfast, Lunch, and Dinner for {currentDay}. Other days will remain untouched.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearSubmit}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-2xl shadow-sm transition-all cursor-pointer"
                >
                  Yes, Clear {currentDay}
                </button>
              </div>
            </div>
          )}

          {activeAction === 'reset' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Reset Entire Weekly Menu?
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  This will restore all 7 days (Monday through Sunday) back to the rich default sample tiffin menu.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetSubmit}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-2xl shadow-sm transition-all cursor-pointer"
                >
                  Reset All to Default
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
