import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  ChefHat,
  CheckCircle2,
  Building2,
  MapPin,
  Utensils,
  FileText,
  Phone,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  Loader2,
  LogOut,
  ArrowRight,
  Plus,
  X,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CITY_AREAS = {
  Ahmedabad: [
    'Navrangpura',
    'Ambawadi',
    'University Area',
    'Satellite',
    'Vastrapur',
    'Prahlad Nagar',
    'Maninagar',
    'Bopal',
    'SG Highway',
  ],
  Mumbai: [
    'Andheri',
    'Bandra',
    'Powai',
    'Dadar',
    'Malad',
    'Borivali',
    'Goregaon',
  ],
  Pune: ['Kothrud', 'Viman Nagar', 'Hinjewadi', 'Baner', 'Wakad', 'Aundh'],
  'Delhi NCR': [
    'Connaught Place',
    'Noida Sector 62',
    'Gurugram Cyber City',
    'Hauz Khas',
    'Dwarka',
  ],
  Bangalore: [
    'Koramangala',
    'HSR Layout',
    'Indiranagar',
    'Whitefield',
    'Electronic City',
  ],
};

const SAMPLE_IMAGES = [
  {
    name: 'Home Thali Kitchen',
    url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Pure Desi Kitchen',
    url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Homely Meal Box',
    url: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80',
  },
];

export default function ProviderOnboarding() {
  const navigate = useNavigate();
  const {
    user,
    loading,
    providerStage,
    submitOnboarding,
    logoutProvider,
  } = useAuth();

  const [formData, setFormData] = useState({
    businessName: '',
    contactNumber: '',
    address: '',
    city: 'Ahmedabad',
    serviceArea: ['Navrangpura', 'Ambawadi', 'University Area'],
    foodType: 'BOTH',
    description: '',
    imageUrl: '',
  });

  const [customAreaInput, setCustomAreaInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Pre-fill contact number once user loads
  useEffect(() => {
    if (user?.phone && !formData.contactNumber) {
      setFormData((prev) => ({
        ...prev,
        contactNumber: user.phone,
      }));
    }
  }, [user]);

  // Route Guard Checks
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-600">Verifying provider session...</span>
        </div>
      </div>
    );
  }

  // If not logged in as Provider, redirect to partner login
  if (!user || user.role !== 'PROVIDER') {
    return <Navigate to="/provider/login" replace />;
  }

  // If already submitted profile (stage is PENDING_APPROVAL or VERIFIED), redirect to status page
  if (providerStage === 'PENDING_APPROVAL' || providerStage === 'VERIFIED') {
    return <Navigate to="/provider/status" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const handleCityChange = (e) => {
    const newCity = e.target.value;
    setFormData((prev) => ({
      ...prev,
      city: newCity,
      // Default to the first 3 areas of that city if available
      serviceArea: CITY_AREAS[newCity] ? CITY_AREAS[newCity].slice(0, 3) : [],
    }));
  };

  const toggleServiceArea = (area) => {
    setFormData((prev) => {
      const exists = prev.serviceArea.includes(area);
      const updated = exists
        ? prev.serviceArea.filter((a) => a !== area)
        : [...prev.serviceArea, area];
      return { ...prev, serviceArea: updated };
    });
  };

  const handleAddCustomArea = (e) => {
    e?.preventDefault();
    const trimmed = customAreaInput.trim();
    if (!trimmed) return;
    if (!formData.serviceArea.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        serviceArea: [...prev.serviceArea, trimmed],
      }));
    }
    setCustomAreaInput('');
  };

  const handleRemoveArea = (areaToRemove) => {
    setFormData((prev) => ({
      ...prev,
      serviceArea: prev.serviceArea.filter((a) => a !== areaToRemove),
    }));
  };

  const handleLogout = async () => {
    await logoutProvider();
    navigate('/partner');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.businessName.trim()) {
      setError('Please provide your kitchen/business name.');
      return;
    }
    if (!formData.address.trim()) {
      setError('Please provide your kitchen street address.');
      return;
    }
    if (!formData.city.trim()) {
      setError('Please select or specify your city.');
      return;
    }
    if (formData.serviceArea.length === 0) {
      setError('Please select or add at least one delivery service locality.');
      return;
    }

    setSubmitting(true);
    try {
      await submitOnboarding({
        businessName: formData.businessName.trim(),
        contactNumber: formData.contactNumber.trim() || user?.phone,
        address: formData.address.trim(),
        city: formData.city.trim(),
        serviceArea: formData.serviceArea,
        foodType: formData.foodType,
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim(),
      });

      setSuccessMessage('Profile submitted successfully! Redirecting to application status...');
      setTimeout(() => {
        navigate('/provider/status');
      }, 700);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to submit onboarding details. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const availableAreas = CITY_AREAS[formData.city] || [];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans antialiased">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white flex items-center justify-center shadow-sm">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold text-slate-900 tracking-tight">
                Tiffin<span className="text-emerald-600">Hub</span>
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Partner Onboarding
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 hidden sm:inline">
              Owner: <strong className="text-slate-800">{user?.name}</strong> ({user?.email})
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-red-200 bg-white transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Stepper Progress Indicator */}
        <div className="mb-8">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-500/20">
                <Check className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-emerald-700 mt-2">Step 1: Account</span>
              <span className="text-[11px] text-slate-400 hidden sm:block">Created & Logged In</span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm ring-4 ring-emerald-100 shadow-md">
                2
              </div>
              <span className="text-xs font-bold text-slate-900 mt-2">Step 2: Kitchen Profile</span>
              <span className="text-[11px] text-emerald-600 font-medium hidden sm:block">Fill Business Details</span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <span className="text-xs font-semibold text-slate-400 mt-2">Step 3: Verification</span>
              <span className="text-[11px] text-slate-400 hidden sm:block">Pending Approval</span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="relative mt-3">
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-1/2 transition-all duration-500"></div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-2xl shadow-slate-200/50">
          <div className="mb-6 pb-6 border-b border-slate-100">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-1 rounded-full text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Step 2: Business & Kitchen Profile</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Tell us about your Tiffin Kitchen
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Provide your kitchen brand name, localities you deliver to, and dietary options.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Business Name & Contact Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Business / Kitchen Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="businessName"
                    required
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="e.g. Patel Tiffin Services"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
                  />
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="contactNumber"
                    required
                    value={formData.contactNumber}
                    onChange={handleChange}
                    placeholder="e.g. 9876543211"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Prefilled from account, editable if using dedicated kitchen phone.
                </span>
              </div>
            </div>

            {/* Row 2: Address & City */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Kitchen Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. 45 Navrangpura, Near Commerce College"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  City <span className="text-red-500">*</span>
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleCityChange}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm cursor-pointer"
                >
                  <option value="Ahmedabad">Ahmedabad</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Pune">Pune</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Bangalore">Bangalore</option>
                </select>
              </div>
            </div>

            {/* Service Area (Localities) Tag Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Service Areas / Delivery Localities in {formData.city} <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Click localities below to toggle them, or add any custom delivery area name.
              </p>

              {/* Selected Tags Display */}
              <div className="flex flex-wrap items-center gap-2 mb-3 min-h-[38px] p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                {formData.serviceArea.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No localities selected yet. Pick or add below:</span>
                ) : (
                  formData.serviceArea.map((area) => (
                    <span
                      key={area}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm"
                    >
                      <span>{area}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveArea(area)}
                        className="hover:bg-emerald-700 rounded-full p-0.5 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Preset Area Suggestions for selected City */}
              {availableAreas.length > 0 && (
                <div className="mb-3">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Popular localities in {formData.city}:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {availableAreas.map((area) => {
                      const isSelected = formData.serviceArea.includes(area);
                      return (
                        <button
                          key={area}
                          type="button"
                          onClick={() => toggleServiceArea(area)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {area}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add Custom Area Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customAreaInput}
                  onChange={(e) => setCustomAreaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomArea();
                    }
                  }}
                  placeholder="Type other locality and press Enter"
                  className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomArea}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Locality</span>
                </button>
              </div>
            </div>

            {/* Food Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                Dietary & Food Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Pure Veg Card */}
                <div
                  onClick={() => setFormData((p) => ({ ...p, foodType: 'VEG' }))}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    formData.foodType === 'VEG'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-5 h-5 rounded-md border-2 border-emerald-600 flex items-center justify-center p-0.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    </span>
                    {formData.foodType === 'VEG' && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Pure Vegetarian</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Strictly 100% vegetarian dishes only.</p>
                </div>

                {/* Non-Veg Card */}
                <div
                  onClick={() => setFormData((p) => ({ ...p, foodType: 'NON_VEG' }))}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    formData.foodType === 'NON_VEG'
                      ? 'border-red-600 bg-red-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-5 h-5 rounded-md border-2 border-red-600 flex items-center justify-center p-0.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                    </span>
                    {formData.foodType === 'NON_VEG' && (
                      <span className="text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Non-Vegetarian</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Specialized meat, chicken & egg meals.</p>
                </div>

                {/* Both Card */}
                <div
                  onClick={() => setFormData((p) => ({ ...p, foodType: 'BOTH' }))}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    formData.foodType === 'BOTH'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <span className="w-4 h-4 rounded-md border-2 border-emerald-600 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      </span>
                      <span className="w-4 h-4 rounded-md border-2 border-red-600 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                      </span>
                    </div>
                    {formData.foodType === 'BOTH' && (
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Both (Veg & Non-Veg)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Separate preparation for veg & non-veg subscribers.</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Kitchen Description & Specialties
              </label>
              <textarea
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g. Authentic homemade Gujarati thali daily prepared with fresh organic ingredients and low oil."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm resize-none"
              ></textarea>
            </div>

            {/* Image URL & Live Preview */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Kitchen Cover Image / Logo URL
              </label>
              <div className="relative mb-2">
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/kitchen.jpg"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
                />
                <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>

              {/* Sample Banner Quick Pickers */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[11px] text-slate-400">Or use a sample image:</span>
                {SAMPLE_IMAGES.map((sample) => (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, imageUrl: sample.url }))}
                    className="text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    {sample.name}
                  </button>
                ))}
              </div>

              {/* Live Preview Box */}
              {formData.imageUrl && (
                <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4">
                  <img
                    src={formData.imageUrl}
                    alt="Kitchen Preview"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                    className="w-20 h-16 object-cover rounded-xl border border-slate-200 shadow-sm"
                  />
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-800 block">Cover Image Preview</span>
                    <span className="text-slate-400 text-[11px] truncate block max-w-xs">{formData.imageUrl}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto min-w-[280px] inline-flex items-center justify-center gap-2 py-4 px-8 rounded-2xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-xl shadow-emerald-600/25 hover:shadow-2xl hover:shadow-emerald-600/35 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting Onboarding Details...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Application & Complete Onboarding</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-400 mt-2">
                By submitting, your kitchen application moves to <strong>Pending Approval</strong> for admin verification.
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
