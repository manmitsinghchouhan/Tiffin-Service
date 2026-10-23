import React, { useState, useEffect } from "react";
import { X, AlertTriangle, Trash2, ShieldAlert } from "lucide-react";

const PRESET_REASONS = [
  "Kitchen reached maximum cooking capacity",
  "Customer address outside daily delivery zone",
  "Kitchen undergoing temporary maintenance",
  "Mutually agreed cancellation with customer",
  "Other reason (custom note)",
];

export default function CancelSubscriptionModal({
  isOpen,
  onClose,
  onConfirm,
  subscription,
  loading = false,
}) {
  const [selectedReason, setSelectedReason] = useState(PRESET_REASONS[0]);
  const [customNote, setCustomNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedReason(PRESET_REASONS[0]);
      setCustomNote("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen || !subscription) return null;

  const customerName =
    subscription.customerId?.name || subscription.customer?.name || "Customer";
  const planTitle =
    subscription.planSnapshot?.name ||
    subscription.planId?.name ||
    subscription.planTitle ||
    "Subscription Plan";

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalReason = selectedReason;

    if (selectedReason === "Other reason (custom note)") {
      if (!customNote.trim()) {
        setError("Please specify the cancellation reason");
        return;
      }
      finalReason = customNote.trim();
    }

    try {
      await onConfirm(finalReason);
    } catch (err) {
      setError(err?.message || "Failed to cancel subscription");
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 relative text-left">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shrink-0">
            <Trash2 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Cancel Customer Subscription
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Confirm plan cancellation for <strong className="text-slate-800">{customerName}</strong>
            </p>
          </div>
        </div>

        {/* Target Details Card */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 mb-4 text-xs space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Plan:</span>
            <span className="font-bold text-slate-900">{planTitle}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Subscriber:</span>
            <span className="font-semibold text-slate-800">{customerName}</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Reason for Cancellation <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => {
                setSelectedReason(e.target.value);
                setError("");
              }}
              disabled={loading}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none cursor-pointer"
            >
              {PRESET_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {selectedReason === "Other reason (custom note)" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Specify Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={customNote}
                onChange={(e) => {
                  setCustomNote(e.target.value);
                  setError("");
                }}
                disabled={loading}
                placeholder="Briefly state why this subscription is being cancelled..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
              />
            </div>
          )}

          {error && (
            <p className="text-xs font-semibold text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          {/* Warning Notice (Required) */}
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Notice:</strong> Cancelling this subscription will immediately stop daily meal dispatches and mark the commercial order as Cancelled.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 text-xs cursor-pointer transition-colors"
            >
              Keep Active
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 disabled:opacity-50 cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{loading ? "Cancelling..." : "Yes, Cancel Subscription"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
