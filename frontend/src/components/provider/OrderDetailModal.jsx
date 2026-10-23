import React, { useState } from "react";
import {
  X,
  Printer,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Receipt,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Utensils,
  IndianRupee,
  ShieldCheck,
  FileText,
} from "lucide-react";
import api from "../../services/api";

export default function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onStatusUpdate,
  onToast,
  onReject,
}) {
  const [updatingStatus, setUpdatingStatus] = useState(false);

  if (!isOpen || !order) return null;

  const plan = order.planSnapshot || order.planId || {};
  const customer = order.customerId || {};
  const addr = order.deliveryAddress || {};
  const orderCode =
    order.orderCode || `#ORD-${order._id?.toString().slice(-6).toUpperCase()}`;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleAction = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      const res = await api.patch(`/provider/orders/${order._id}/status`, {
        status: newStatus,
      });
      if (res.data?.success) {
        if (onToast) onToast(`Order ${orderCode} updated to ${newStatus}.`);
        if (onStatusUpdate) onStatusUpdate(order._id, newStatus);
        onClose();
      }
    } catch (err) {
      console.error("Failed to update order status:", err);
      if (onToast) {
        onToast(
          err.response?.data?.message || "Failed to update order status."
        );
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const status = order.status || "PENDING";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 my-8 relative">
        {/* Top Header */}
        <div className="flex items-start justify-between pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0 shadow-xs">
              <Receipt className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  Commercial Invoice & Receipt
                </h3>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {orderCode}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Placed on {formatDate(order.orderDate || order.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Body (Print-optimized) */}
        <div className="py-5 space-y-6">
          {/* Status Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500">Order Status:</span>
              {status === "PENDING" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Pending Provider Approval
                </span>
              ) : status === "ACCEPTED" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Accepted & Active
                </span>
              ) : status === "COMPLETED" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Completed
                </span>
              ) : status === "CANCELLED" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <XCircle className="w-3.5 h-3.5" />
                  Cancelled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  {status}
                </span>
              )}
            </div>

            {status === "CANCELLED" ? (
              <div className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Refund Pending</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Paid Online (Verified)</span>
              </div>
            )}
          </div>

          {/* Cancellation Reason Notice */}
          {status === "CANCELLED" && (
            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs text-rose-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Subscription Cancelled</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                <strong>Reason:</strong>{" "}
                {order.cancellationReason || "Kitchen reached maximum cooking capacity"}
              </p>
              {order.cancelledAt && (
                <p className="text-[10px] text-rose-600">
                  Cancelled on {formatDate(order.cancelledAt)}
                </p>
              )}
            </div>
          )}

          {/* Customer & Delivery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Customer Details */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Customer Information
              </span>
              <p className="font-bold text-slate-900 text-sm">{customer.name || "Customer"}</p>
              <p className="text-slate-600 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{customer.phone || addr.contactPhone || "No contact"}</span>
              </p>
              <p className="text-slate-600 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{customer.email || "No email"}</span>
              </p>
            </div>

            {/* Delivery Address */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Delivery Location
              </span>
              <p className="font-semibold text-slate-900 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>{addr.street || "Address not provided"}</span>
              </p>
              <p className="text-slate-600 pl-5">
                {[addr.landmark, addr.city, addr.postalCode].filter(Boolean).join(", ")}
              </p>
              <p className="text-slate-500 pl-5">
                Delivery Contact:{" "}
                <span className="font-semibold text-slate-700">{addr.contactPhone || customer.phone || "—"}</span>
              </p>
            </div>
          </div>

          {/* Special Kitchen Notes */}
          {(order.notes || addr.landmark) && (
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-950 block">Customer Dietary / Delivery Notes:</span>
                <p className="text-amber-800 italic mt-0.5">{order.notes || "No special dietary instructions."}</p>
              </div>
            </div>
          )}

          {/* Itemized Order Breakdown */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Plan Item</th>
                  <th className="py-2.5 px-4">Duration</th>
                  <th className="py-2.5 px-4">Diet & Slot</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{plan.name || "Tiffin Meal Package"}</span>
                    <span className="text-[11px] text-slate-400">Recurring kitchen meal subscription</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    {plan.durationDays || 30} Days
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold">
                        🍴 {plan.mealType || "Lunch"}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                        {plan.diet === "NON_VEG" ? "🍗 Non-Veg" : "🌱 Veg"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                    ₹{(order.totalAmount || plan.price || 0).toLocaleString("en-IN")}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50/80 border-t border-slate-200 font-semibold text-slate-700">
                <tr>
                  <td colSpan={3} className="py-2 px-4 text-slate-500">
                    Subtotal
                  </td>
                  <td className="py-2 px-4 text-right">
                    ₹{(order.totalAmount || plan.price || 0).toLocaleString("en-IN")}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-2 px-4 text-slate-500">
                    Delivery & Packaging
                  </td>
                  <td className="py-2 px-4 text-right text-emerald-600 font-bold">
                    FREE (Included)
                  </td>
                </tr>
                <tr className="border-t border-slate-200 text-sm font-extrabold text-slate-900 bg-slate-100/60">
                  <td colSpan={3} className="py-3 px-4">
                    Total Amount Paid
                  </td>
                  <td className="py-3 px-4 text-right text-blue-700">
                    ₹{(order.totalAmount || plan.price || 0).toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {status === "PENDING" && (
              <>
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleAction("ACCEPTED")}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50 transition-all"
                >
                  {updatingStatus ? "Updating..." : "Accept Order"}
                </button>
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => {
                    if (onReject) {
                      onReject(order);
                    } else {
                      handleAction("REJECTED");
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs cursor-pointer disabled:opacity-50 transition-all"
                >
                  Reject
                </button>
              </>
            )}

            {status === "ACCEPTED" && (
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => handleAction("COMPLETED")}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50 transition-all"
              >
                Mark as Completed
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
