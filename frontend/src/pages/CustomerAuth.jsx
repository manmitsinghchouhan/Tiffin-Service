import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowLeft, Loader2, CheckCircle2, Utensils } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CustomerAuth({ initialMode = 'login' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginCustomer, registerCustomer } = useAuth();

  // Mode can be 'login' or 'register'
  const [mode, setMode] = useState(
    location.pathname === '/register' || initialMode === 'register' ? 'register' : 'login'
  );

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMessage('');
    navigate(newMode === 'register' ? '/register' : '/login', {
      state: location.state,
      replace: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        // Customer Login via AuthContext (stores user in React Context, sets cookie via backend)
        await loginCustomer(formData.email, formData.password);

        setSuccessMessage('Logged in successfully! Redirecting...');
        setTimeout(() => {
          if (
            location.state?.from === 'subscribe' &&
            location.state?.kitchenId &&
            location.state?.planId
          ) {
            navigate(
              `/?subscribeKitchenId=${location.state.kitchenId}&subscribePlanId=${location.state.planId}`
            );
          } else {
            navigate('/');
          }
        }, 800);
      } else {
        // Customer Registration via AuthContext
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Password and confirm password do not match');
        }

        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }

        const data = await registerCustomer({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        });

        // Do not auto-login; prompt user to login with their new credentials
        setSuccessMessage(data.message || 'Registration successful! Please log in with your email and password.');
        
        // Preserve email for easy login, clear passwords
        setFormData(prev => ({
          ...prev,
          password: '',
          confirmPassword: '',
        }));

        // Transition to login view
        setMode('login');
        window.history.pushState(null, '', '/login');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-100/50 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top back link to website */}
      <div className="absolute top-6 left-6 sm:left-12 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        
        {/* Auth Card Matching Figma Style */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl shadow-slate-200/60 rounded-3xl border border-slate-100">
          
          {/* Top Label / Tag */}
          <div className="mb-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
              Customer Account
            </span>
          </div>

          {/* Subscription Context Banner if redirected from subscribing */}
          {location.state?.from === 'subscribe' && (
            <div className="mb-6 p-4 rounded-2xl bg-blue-50/90 border border-blue-200 text-blue-900 text-xs sm:text-sm flex items-start gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900">
                  Subscribe to {location.state.planName || 'Selected Meal Plan'}
                </p>
                <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                  Please log in or create an account. You will automatically return to complete your subscription with{' '}
                  <span className="font-bold">{location.state.kitchenName || 'the provider'}</span>.
                </p>
              </div>
            </div>
          )}

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
            {mode === 'login' ? 'Log in' : 'Create an Account'}
          </h2>

          {/* Subtitle */}
          <p className="text-sm text-slate-500 mb-6">
            {mode === 'login'
              ? 'Log in your account'
              : 'Join TiffinHub to enjoy fresh homely meals'}
          </p>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Registration Extra Fields: Full Name & Phone */}
            {mode === 'register' && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your 10-digit phone number"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  />
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={mode === 'register' ? 'Min. 6 characters' : 'Enter your password'}
                  className="w-full pl-4 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (Register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className="w-full pl-4 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{mode === 'login' ? 'Logging in...' : 'Creating account...'}</span>
                  </>
                ) : (
                  <span>{mode === 'login' ? 'Log in' : 'Register'}</span>
                )}
              </button>
            </div>

          </form>

          {/* Toggle between Login and Register */}
          <div className="mt-8 text-center text-sm text-slate-500">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleModeSwitch('register')}
                  className="font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  Register
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleModeSwitch('login')}
                  className="font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  Log in
                </button>
              </p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
