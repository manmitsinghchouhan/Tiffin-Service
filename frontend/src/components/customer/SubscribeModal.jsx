import React, { useState } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Star,
  Heart,
  Info,
  Utensils,
  CreditCard,
  Banknote,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Format helper for YYYY-MM-DD
const getTomorrowDateString = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

const formatDateReadable = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export default function SubscribeModal({ plan, kitchen, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form State
  const [startDate, setStartDate] = useState(getTomorrowDateString());
  const [street, setStreet] = useState('');
  const [city, setCity] = useState(kitchen?.city || '');
  const [postalCode, setPostalCode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [instructions, setInstructions] = useState('');
  const [autoRenewal, setAutoRenewal] = useState(plan?.isSubscriptionAvailable !== false);
  const [paymentMode, setPaymentMode] = useState('TEST_ONLINE'); // 'TEST_ONLINE' | 'COD'

  const [loading, setLoading] = useState(false);
  const [simulationStep, setSimulationStep] = useState('');
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  if (!plan || !kitchen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!street.trim()) {
      setError('Please provide a complete street address');
      return;
    }
    if (!city.trim()) {
      setError('Please provide a city');
      return;
    }
    if (!contactPhone.trim()) {
      setError('Please provide a contact phone number');
      return;
    }

    setLoading(true);

    // If online payment test simulation is selected, show realistic 1.2s gateway delay
    if (paymentMode === 'TEST_ONLINE') {
      setSimulationStep('Connecting to secure payment gateway...');
      await new Promise((r) => setTimeout(r, 600));
      setSimulationStep('Simulating transaction authorization...');
      await new Promise((r) => setTimeout(r, 600));
    }

    try {
      const payload = {
        planId: plan._id,
        startDate,
        deliveryAddress: {
          street: street.trim(),
          city: city.trim(),
          postalCode: postalCode.trim(),
          landmark: landmark.trim(),
          contactPhone: contactPhone.trim(),
        },
        autoRenewal: plan.isSubscriptionAvailable ? autoRenewal : false,
        notes: instructions.trim(),
      };

      const res = await api.post('/customer/subscriptions', payload);
      if (res.data?.success) {
        setSuccessData(res.data.data);
      } else {
        throw new Error(res.data?.message || 'Subscription failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to complete subscription. Please try again.');
    } finally {
      setLoading(false);
      setSimulationStep('');
    }
  };

  const bannerImg =
    kitchen?.imageUrl ||
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 lg:p-6 animate-fadeIn">
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[94vh] flex flex-col animate-scaleUp">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-slate-100/90 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ================= STEP 4: SUCCESS VIEW ================= */}
        {successData ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center max-w-xl mx-auto my-auto animate-scaleUp">
            
            {/* Celebration Icon with Burst */}
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <Sparkles className="w-6 h-6 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
              Subscription Successful!
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              You have successfully subscribed to <span className="font-bold text-slate-900">{plan.name}</span>.
            </p>

            {/* Receipt Summary Card */}
            <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-5 mb-8 text-left space-y-3 shadow-2xs">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">Kitchen</span>
                <span className="font-bold text-slate-900">{kitchen.businessName}</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">Plan</span>
                <span className="font-bold text-slate-900">{plan.name}</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">Start Date</span>
                <span className="font-bold text-slate-800">{formatDateReadable(successData.startDate)}</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">End Date</span>
                <span className="font-bold text-slate-800">{formatDateReadable(successData.endDate)}</span>
              </div>
              <div className="flex justify-between items-center pt-1 text-sm font-bold">
                <span className="text-slate-700">Amount Paid</span>
                <span className="text-blue-600 text-base">₹{plan.price.toLocaleString()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/customer/dashboard');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/customer/dashboard');
                }}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-6 rounded-xl border border-slate-200 text-xs transition-all cursor-pointer"
              >
                View Subscription Details
              </button>
            </div>

          </div>
        ) : (
          /* ================= STEP 3: CHECKOUT SPLIT MODAL ================= */
          <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto">
            
            {/* LEFT COLUMN: SELECTED PLAN SUMMARY (Matches Reference Image Step 3) */}
            <div className="w-full lg:w-[380px] bg-slate-50/80 border-b lg:border-b-0 lg:border-r border-slate-100 p-6 sm:p-7 flex flex-col justify-between shrink-0">
              <div className="space-y-6">
                
                {/* Kitchen Banner Photo */}
                <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-slate-200 shadow-sm group">
                  <img
                    src={bannerImg}
                    alt={kitchen.businessName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                  
                  {/* Verified Badge */}
                  <div className="absolute top-3 left-3 bg-emerald-500/95 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </div>

                  {/* Favorite Heart */}
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-slate-500 flex items-center justify-center shadow-sm">
                    <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                  </div>
                </div>

                {/* Kitchen Identity & Rating */}
                <div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white font-bold text-base shadow-sm shadow-amber-500/20 shrink-0">
                      {kitchen.businessName ? kitchen.businessName.charAt(0).toUpperCase() : 'K'}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-tight">
                        {kitchen.businessName}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center text-amber-500 font-bold text-xs gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>4.8</span>
                        </div>
                        <span className="text-slate-400 text-xs font-medium">(120 reviews)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{kitchen.address ? `${kitchen.address}, ` : ''}{kitchen.city}</span>
                  </div>
                </div>

                {/* Selected Plan Details */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
                      Selected Plan
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-blue-600">
                        ₹{plan.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        / {plan.durationDays} days
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <span className="bg-blue-50 text-blue-700 font-medium px-2.5 py-1 rounded-lg border border-blue-100 flex items-center gap-1">
                      <Utensils className="w-3 h-3 text-blue-600" />
                      {plan.mealType?.replace('_', ' ')}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg font-semibold ${
                      plan.diet === 'VEG'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      {plan.diet === 'VEG' ? '🌱 Veg' : '🍗 Non-Veg'}
                    </span>
                    <span className="bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      All Days
                    </span>
                  </div>

                  {/* Checklist of features */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    {(plan.features && plan.features.length > 0
                      ? plan.features
                      : [
                          '4 Rotis / Phulkas',
                          'Dal Tadka',
                          'Seasonal Sabzi',
                          'Rice + Salad'
                        ]
                    ).map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Left Column Bottom: Total Amount */}
              <div className="pt-6 mt-6 border-t border-slate-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600">Total Amount</span>
                <span className="text-2xl font-black text-blue-600">
                  ₹{plan.price.toLocaleString()}
                </span>
              </div>
            </div>

            {/* RIGHT COLUMN: COMPLETE YOUR SUBSCRIPTION FORM */}
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Complete Your Subscription</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Fill in the details to confirm your meal subscription.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* 1. Start Date Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      required
                      min={getTomorrowDateString()}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Deliveries start on this date. Tiffin services require 1-day prep notice.
                  </p>
                </div>

                {/* 2. Delivery Address */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Delivery Address
                  </h4>

                  {/* Street Address */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="House No., Building, Area, Street Name"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* City & Pincode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Mumbai"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Pincode <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="400053"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Landmark */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Metro Station, Beside City Tower"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Contact Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Phone <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Delivery Instructions */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Delivery Instructions (Optional)
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {instructions.length}/200
                      </span>
                    </div>
                    <textarea
                      maxLength={200}
                      rows={2}
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="e.g. Please leave at security desk. Less spicy food."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>

                {/* 3. Enable Auto-Renewal */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="autoRenewalCheck"
                    disabled={plan.isSubscriptionAvailable === false}
                    checked={autoRenewal}
                    onChange={(e) => setAutoRenewal(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <label
                      htmlFor="autoRenewalCheck"
                      className="text-xs font-bold text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Enable Auto-Renewal</span>
                      <Info className="w-3.5 h-3.5 text-blue-500 inline" />
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {plan.isSubscriptionAvailable !== false
                        ? `Your subscription will automatically renew after ${plan.durationDays} days. You can pause or cancel anytime.`
                        : `This plan is a fixed ${plan.durationDays}-day package. Auto-renewal is not applicable.`}
                    </p>
                  </div>
                </div>

                {/* 4. Payment Method Selection (Simulator as agreed) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Payment Mode
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      🔒 Secure Checkout
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Option 1: Dev Test Online Payment */}
                    <div
                      onClick={() => setPaymentMode('TEST_ONLINE')}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                        paymentMode === 'TEST_ONLINE'
                          ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-900 leading-tight">
                          Test Online Payment
                        </p>
                        <p className="text-[10px] text-blue-700 font-medium">Instant Dev Approval</p>
                      </div>
                    </div>

                    {/* Option 2: Pay on 1st Delivery */}
                    <div
                      onClick={() => setPaymentMode('COD')}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                        paymentMode === 'COD'
                          ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <Banknote className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-900 leading-tight">
                          Pay on 1st Delivery
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">Cash / UPI at Door</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confirm & Subscribe Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{simulationStep || 'Creating your subscription...'}</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Subscribe</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

              </form>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
