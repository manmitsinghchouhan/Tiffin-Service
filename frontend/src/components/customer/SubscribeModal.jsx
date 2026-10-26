import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Clock,
  Home,
  Building2,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Format helpers for YYYY-MM-DD
const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

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

const parseCutoffStringToDate = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  const result = new Date();
  result.setHours(hours, minutes, 0, 0);
  return result;
};

export default function SubscribeModal({ plan, kitchen, onClose, existingSubscription = null }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Evaluate kitchen order cutoff deadlines
  const orderTiming = kitchen?.settings?.orderTiming || {};
  const lunchCutoff = orderTiming.lunchCutoff || '09:30 AM';
  const dinnerCutoff = orderTiming.dinnerCutoff || '04:30 PM';

  const now = new Date();
  const lunchCutoffDate = parseCutoffStringToDate(lunchCutoff);
  const dinnerCutoffDate = parseCutoffStringToDate(dinnerCutoff);
  const mealType = (plan?.mealType || 'LUNCH').toUpperCase();

  let isCutoffExceeded = false;
  let relevantCutoffTime = lunchCutoff;
  let cutoffMealLabel = 'Lunch';

  if (mealType === 'LUNCH' || mealType === 'BREAKFAST') {
    if (lunchCutoffDate && now > lunchCutoffDate) {
      isCutoffExceeded = true;
      relevantCutoffTime = lunchCutoff;
      cutoffMealLabel = 'Lunch';
    }
  } else if (mealType === 'DINNER') {
    if (dinnerCutoffDate && now > dinnerCutoffDate) {
      isCutoffExceeded = true;
      relevantCutoffTime = dinnerCutoff;
      cutoffMealLabel = 'Dinner';
    }
  } else if (mealType === 'LUNCH_DINNER' || mealType === 'ALL_MEALS') {
    if (dinnerCutoffDate && now > dinnerCutoffDate) {
      isCutoffExceeded = true;
      relevantCutoffTime = dinnerCutoff;
      cutoffMealLabel = 'Daily';
    } else if (lunchCutoffDate && now > lunchCutoffDate) {
      // Lunch cutoff passed, but dinner is still open today!
      relevantCutoffTime = lunchCutoff;
      cutoffMealLabel = 'Lunch';
    }
  }

  const lunchDeliveryWindow = orderTiming.lunchDeliveryWindow || '12:00 PM - 01:30 PM';
  const dinnerDeliveryWindow = orderTiming.dinnerDeliveryWindow || '07:30 PM - 09:00 PM';

  let planDeliveryWindow = lunchDeliveryWindow;
  if (mealType === 'DINNER') {
    planDeliveryWindow = dinnerDeliveryWindow;
  } else if (mealType === 'LUNCH_DINNER' || mealType === 'ALL_MEALS') {
    planDeliveryWindow = `${lunchDeliveryWindow} (Lunch) • ${dinnerDeliveryWindow} (Dinner)`;
  }

  // Form State
  const [hasAgreedToCutoff, setHasAgreedToCutoff] = useState(!isCutoffExceeded);
  const [startDate, setStartDate] = useState(
    isCutoffExceeded ? getTomorrowDateString() : getTodayDateString()
  );
  const [street, setStreet] = useState('');
  const [city, setCity] = useState(kitchen?.city || '');
  const [postalCode, setPostalCode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [instructions, setInstructions] = useState('');
  const [autoRenewal, setAutoRenewal] = useState(plan?.isSubscriptionAvailable !== false);
  const [paymentMode] = useState('DIRECT');

  // Address Book Integration
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(''); // id or 'new'
  const [addressLabel, setAddressLabel] = useState('Home');
  const [isFetchingAddresses, setIsFetchingAddresses] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchAddresses = async () => {
      try {
        setIsFetchingAddresses(true);
        const res = await api.get('/customer/addresses');
        if (isMounted && res.data?.success && Array.isArray(res.data.data)) {
          const addrs = res.data.data;
          setSavedAddresses(addrs);
          if (addrs.length > 0) {
            const defaultAddr = addrs.find((a) => a.isDefault) || addrs[0];
            setSelectedAddressId(defaultAddr._id);
            setStreet(defaultAddr.street || '');
            setCity(defaultAddr.city || kitchen?.city || '');
            setPostalCode(defaultAddr.postalCode || '');
            setLandmark(defaultAddr.landmark || '');
            setContactPhone(defaultAddr.contactPhone || user?.phone || '');
            setAddressLabel(defaultAddr.label || 'Home');
          }
        }
      } catch (err) {
        console.error('Failed to load saved addresses:', err);
      } finally {
        if (isMounted) setIsFetchingAddresses(false);
      }
    };

    fetchAddresses();
    return () => {
      isMounted = false;
    };
  }, [kitchen?.city, user?.phone]);

  const handleSelectAddress = (addr) => {
    setSelectedAddressId(addr._id);
    setStreet(addr.street || '');
    setCity(addr.city || kitchen?.city || '');
    setPostalCode(addr.postalCode || '');
    setLandmark(addr.landmark || '');
    setContactPhone(addr.contactPhone || user?.phone || '');
    setAddressLabel(addr.label || 'Home');
  };

  const handleSelectNewAddress = () => {
    setSelectedAddressId('new');
    setStreet('');
    setCity(kitchen?.city || '');
    setPostalCode('');
    setLandmark('');
    setContactPhone(user?.phone || '');
    setAddressLabel('Home');
  };

  const [loading, setLoading] = useState(false);
  const [simulationStep, setSimulationStep] = useState('');
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(existingSubscription);

  if (!plan || !kitchen) return null;

  const isPaused =
    kitchen?.isAcceptingOrders === false || kitchen?.operatingStatus === 'BUSY';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (isPaused) {
      setError(
        `${kitchen?.businessName || 'This kitchen'} is currently at capacity and has paused taking new subscriptions.`
      );
      return;
    }

    if (isCutoffExceeded && !hasAgreedToCutoff) {
      setError(
        `Today's ${cutoffMealLabel} cutoff (${relevantCutoffTime}) has passed. Please click "I Understand, Start Tomorrow" above to proceed.`
      );
      return;
    }

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

    // Realistic quick payment confirmation delay
    setSimulationStep('Authorizing direct payment...');
    await new Promise((r) => setTimeout(r, 600));

    try {
      const payload = {
        planId: plan._id,
        startDate,
        deliveryAddress: {
          label: addressLabel || 'Home',
          street: street.trim(),
          city: city.trim(),
          postalCode: postalCode.trim(),
          landmark: landmark.trim(),
          contactPhone: contactPhone.trim(),
        },
        autoRenewal: plan.isSubscriptionAvailable ? autoRenewal : false,
        notes: instructions.trim(),
        paymentMode: 'DIRECT',
      };

      const res = await api.post('/customer/subscriptions', payload);
      if (res.data?.success) {
        setSuccessData({
          ...res.data.data,
          autoAccepted: res.data.autoAccepted,
          cutoffApplied: res.data.cutoffApplied,
          cutoffNotice: res.data.cutoffNotice,
          responseMsg: res.data.message,
        });
      } else {
        throw new Error(res.data?.message || 'Subscription failed');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to complete subscription. Please try again.'
      );
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
        {successData ? (() => {
          const isPending =
            successData.status === "PENDING" || successData.autoAccepted === false;
          return (
            <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center max-w-xl mx-auto my-auto animate-scaleUp">
              
              {/* Icon */}
              {isPending ? (
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Clock className="w-10 h-10 text-amber-600 animate-pulse" />
                  </div>
                </div>
              ) : (
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                  </div>
                  <Sparkles className="w-6 h-6 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
                </div>
              )}

              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
                {isPending ? "Subscription Request Placed!" : "Subscription Successful!"}
              </h3>
              <p className="text-sm text-slate-600 mb-5">
                {isPending
                  ? `Your subscription request for ${plan.name} has been sent to ${kitchen.businessName}.`
                  : `You have successfully subscribed to ${plan.name}.`}
              </p>

              {/* Awaiting Confirmation Notice Banner for Manual Mode */}
              {isPending && (
                <div className="w-full bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 mb-6 text-left flex items-start gap-3 shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-950 text-xs">
                      Awaiting Kitchen Confirmation
                    </p>
                    <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                      This kitchen manually approves new subscriptions based on daily cooking prep capacity. Your plan details are reserved and deliveries will begin once approved.
                    </p>
                  </div>
                </div>
              )}

              {/* Receipt Summary Card */}
              <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-5 mb-8 text-left space-y-3 shadow-2xs">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 text-xs">
                  <span className="text-slate-500 font-medium">Subscription Status</span>
                  {isPending ? (
                    <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      Pending Kitchen Confirmation
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      ✓ Active (Auto-Accepted)
                    </span>
                  )}
                </div>
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
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 text-xs">
                  <span className="text-slate-500 font-medium">Daily Delivery Slot</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    {planDeliveryWindow}
                  </span>
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
          );
        })() : (
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
                        <div className="flex items-center text-amber-500 font-bold text-xs gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>
                            {kitchen.reviewsCount > 0
                              ? Number(kitchen.rating || 0).toFixed(1)
                              : 'New'}
                          </span>
                        </div>
                        {kitchen.reviewsCount > 0 && (
                          <span className="text-slate-400 text-xs font-medium">
                            ({kitchen.reviewsCount} {kitchen.reviewsCount === 1 ? 'review' : 'reviews'})
                          </span>
                        )}
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

                  {/* Operational Cutoff & First Delivery Info */}
                  <div className="pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>First Delivery:</span>
                      </span>
                      <span className="font-bold text-slate-900 bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-100">
                        {formatDateReadable(startDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-medium">Expected Delivery:</span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {planDeliveryWindow}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Daily Order Cutoff:</span>
                      <span className="font-semibold text-slate-600">{relevantCutoffTime}</span>
                    </div>
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

              {/* Interactive Daily Cutoff Warning & Customer Agreement */}
              {isCutoffExceeded && !hasAgreedToCutoff && (
                <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-amber-950">
                          Today's {cutoffMealLabel} Cutoff ({relevantCutoffTime}) Has Passed
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200/80 text-amber-900 uppercase tracking-wider">
                          Kitchen Notice
                        </span>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Kitchen staff have already finished packaging for today's {cutoffMealLabel.toLowerCase()}. To ensure fresh food prep, your subscription will start on <strong>Tomorrow, {formatDateReadable(getTomorrowDateString())}</strong>.
                      </p>
                      <div className="pt-1 flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setStartDate(getTomorrowDateString());
                            setHasAgreedToCutoff(true);
                            setError(null);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>I Understand, Start Tomorrow ({formatDateReadable(getTomorrowDateString())})</span>
                        </button>
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-3.5 py-2 text-xs font-semibold text-amber-800 hover:text-amber-950 hover:bg-amber-100/60 rounded-xl transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirmed Rollover Schedule Badge */}
              {isCutoffExceeded && hasAgreedToCutoff && (
                <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 leading-tight">
                        First Delivery: Tomorrow, {formatDateReadable(startDate)}
                      </p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Confirmed schedule (Due to kitchen's daily {relevantCutoffTime} cutoff deadline)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasAgreedToCutoff(false)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer shrink-0"
                  >
                    Change
                  </button>
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
                      min={isCutoffExceeded ? getTomorrowDateString() : getTodayDateString()}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isCutoffExceeded
                      ? `Locked to tomorrow or later because today's ${relevantCutoffTime} cutoff has passed.`
                      : 'Deliveries begin on this date.'}
                  </p>
                </div>

                {/* 2. Delivery Address */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Delivery Address
                    </h4>
                    {savedAddresses.length > 0 && (
                      <span className="text-[11px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        {savedAddresses.length} saved {savedAddresses.length === 1 ? 'address' : 'addresses'}
                      </span>
                    )}
                  </div>

                  {/* Saved Address Selection Chips */}
                  {savedAddresses.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pb-1">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr._id;
                        return (
                          <button
                            key={addr._id}
                            type="button"
                            onClick={() => handleSelectAddress(addr)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-blue-50 text-blue-700 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {addr.label === 'Home' ? (
                              <Home className="w-3.5 h-3.5 text-blue-600" />
                            ) : addr.label === 'Office' ? (
                              <Building2 className="w-3.5 h-3.5 text-amber-600" />
                            ) : (
                              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                            <span>{addr.label}</span>
                            {addr.isDefault && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                                Default
                              </span>
                            )}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={handleSelectNewAddress}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          selectedAddressId === 'new'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-600 border-dashed border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New</span>
                      </button>
                    </div>
                  )}

                  {/* If new address is selected or no saved addresses exist yet, allow choosing label */}
                  {(selectedAddressId === 'new' || savedAddresses.length === 0) && (
                    <div className="flex items-center gap-3 p-2.5 bg-blue-50/70 rounded-xl border border-blue-100 flex-wrap">
                      <span className="text-xs font-bold text-slate-700">Save As:</span>
                      <div className="flex items-center gap-2">
                        {['Home', 'Office', 'Other'].map((lbl) => (
                          <button
                            key={lbl}
                            type="button"
                            onClick={() => setAddressLabel(lbl)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              addressLabel === lbl
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-500 ml-auto hidden sm:inline">
                        ✨ Saves automatically to Address Book
                      </span>
                    </div>
                  )}

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

                {/* 4. Payment Method - Single Direct Payment Option */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Payment Method
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Direct Payment</span>
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-blue-600/60 bg-blue-50/50 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                          <span>Direct Payment (UPI / Card / NetBanking)</span>
                          <span className="text-[10px] font-extrabold bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded">
                            Instant
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          1-Click payment confirmation • Seamlessly saved in your dashboard
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span className="text-xs font-black text-blue-700 bg-white px-2.5 py-1 rounded-xl border border-blue-200">
                        ₹{plan.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confirm & Subscribe Button */}
                <button
                  type="submit"
                  disabled={loading || isPaused || (isCutoffExceeded && !hasAgreedToCutoff)}
                  className={`w-full font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base mt-2 ${
                    isPaused || (isCutoffExceeded && !hasAgreedToCutoff)
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 cursor-pointer'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{simulationStep || 'Creating your subscription...'}</span>
                    </>
                  ) : isPaused ? (
                    <span>Kitchen At Capacity (Paused)</span>
                  ) : isCutoffExceeded && !hasAgreedToCutoff ? (
                    <span>Please Confirm Start Date Above to Proceed</span>
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
