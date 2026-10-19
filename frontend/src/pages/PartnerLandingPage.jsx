import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  UserPlus,
  LogIn,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ChefHat,
  UtensilsCrossed,
  Clock,
} from "lucide-react";

export default function PartnerLandingPage() {
  const benefits = [
    {
      icon: <TrendingUp className="w-6 h-6 text-blue-600" />,
      title: "Guaranteed Daily Demand",
      description:
        "Connect with office professionals and students seeking reliable daily and weekly recurring meal subscriptions.",
    },
    {
      icon: <DollarSign className="w-6 h-6 text-emerald-600" />,
      title: "Timely & Transparent Payouts",
      description:
        "Direct bank or UPI transfers with transparent order ledgers and zero hidden transaction fees.",
    },
    {
      icon: <UtensilsCrossed className="w-6 h-6 text-indigo-600" />,
      title: "Complete Menu & Schedule Control",
      description:
        "Set your own weekly menus for Breakfast, Lunch, and Dinner. Pause services or set vacation days anytime.",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-amber-600" />,
      title: "Verified Partner Badge",
      description:
        "Stand out with an official TiffinHub Verified Kitchen badge that inspires customer trust and boosts orders.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Quick Registration",
      subtitle: "Create your owner profile",
      description:
        "Provide your name, phone, email, and secure password to create your provider account in under 2 minutes.",
    },
    {
      number: "02",
      title: "Complete Onboarding",
      subtitle: "Add kitchen & business details",
      description:
        "Tell us about your kitchen, dietary offerings (Pure Veg, Non-Veg, or Both), delivery areas, and kitchen photos.",
    },
    {
      number: "03",
      title: "Verification & Launch",
      subtitle: "Start receiving daily orders",
      description:
        "Our admin team swiftly verifies your kitchen standards. Once approved, your tiffin packages go live to thousands!",
    },
  ];

  const requirements = [
    "Clean, hygienic home kitchen or commercial preparation facility",
    "Commitment to high quality ingredients and fresh daily preparation",
    "Reliable on-time meal packaging for lunch and dinner dispatch",
    "Valid identity proof and active contact number for business operations",
    "FSSAI registration or willingness to adhere to basic food safety standards",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-700">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#f0f6ff] via-[#f8faff] to-white pt-12 pb-16 lg:pt-16 lg:pb-24">
          {/* Decorative ambient leaf shapes */}
          <div className="absolute top-10 left-6 w-32 h-32 opacity-25 pointer-events-none text-blue-300">
            <svg viewBox="0 0 100 100" fill="currentColor">
              <path d="M10,80 Q30,10 80,10 Q90,50 30,85 Z" />
            </svg>
          </div>
          <div className="absolute bottom-10 right-8 w-28 h-28 opacity-25 pointer-events-none text-blue-300">
            <svg viewBox="0 0 100 100" fill="currentColor">
              <path d="M20,90 Q40,20 90,20 Q100,60 40,95 Z" />
            </svg>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-100/90 border border-blue-200/60 text-blue-700 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>
                Become a Tiffin Partner • For Home Chefs & Cloud Kitchens
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-5 max-w-4xl mx-auto">
              Turn Your Passion For Cooking Into a <br />
              <span className="text-blue-600">Thriving Tiffin Business</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-12 max-w-2xl mx-auto">
              Join our network of verified tiffin service providers. Scale your
              daily deliveries, reach regular corporate subscribers, and manage
              all your menus in one intuitive platform.
            </p>

            {/* Two Action Cards (Matching Image 1 Reference) */}
            <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 text-left">
              {/* Option A: Join Now (New Provider Registration) */}
              <div className="relative group bg-white rounded-3xl p-7 border-2 border-emerald-500/20 hover:border-emerald-500 shadow-xl shadow-emerald-500/5 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  New Partner
                </div>
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5 shadow-sm">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    Join Now
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    Start your 2-step onboarding wizard. Create your account and
                    set up your kitchen profile.
                  </p>
                </div>
                <Link
                  to="/provider/register"
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-6 rounded-2xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all"
                >
                  <span>Register as a Provider</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Option B: Already a Partner (Login) */}
              <div className="relative group bg-white rounded-3xl p-7 border border-slate-200 hover:border-blue-500 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                <div className="absolute top-4 right-4 bg-blue-50 text-blue-700 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Existing Partner
                </div>
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5 shadow-sm">
                    <LogIn className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    Already a Partner?
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    Sign in to your provider account to view your application
                    approval status or manage meals.
                  </p>
                </div>
                <Link
                  to="/provider/login"
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-600 text-white font-semibold py-3.5 px-6 rounded-2xl shadow-md transition-all"
                >
                  <span>Go to Provider Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 pt-8 border-t border-slate-200/60 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  100+
                </div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  Active Kitchens
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  ₹45,000+
                </div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  Avg. Monthly Earning
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  48 Hours
                </div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  Fast Verification
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3.5 py-1 rounded-full">
                PARTNER BENEFITS
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3 mb-4">
                Why Partner With{" "}
                <span className="text-blue-600">TiffinHub?</span>
              </h2>
              <p className="text-base text-slate-600">
                We handle discovery, subscription management, and payment
                processing so you can focus on cooking delicious food.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="bg-[#f8fafc] rounded-3xl p-7 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-5 border border-slate-100">
                    {benefit.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="py-20 bg-[#fafcff] border-y border-slate-100"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-100/80 px-3.5 py-1 rounded-full">
                SIMPLE ONBOARDING
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3 mb-4">
                How Onboarding Works
              </h2>
              <p className="text-base text-slate-600">
                From registration to serving your first customer in 3
                straightforward steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-8 border border-slate-100 shadow-lg shadow-slate-200/40 relative flex flex-col justify-between"
                >
                  <div>
                    <div className="text-3xl font-black text-blue-600/30 mb-4">
                      {step.number}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">
                      {step.title}
                    </h3>
                    <p className="text-xs font-semibold text-blue-600 mb-3 uppercase tracking-wider">
                      {step.subtitle}
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Requirements Section */}
        <section id="requirements" className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
              {/* Background accent icon */}
              <div className="absolute right-4 bottom-4 text-white/5 pointer-events-none">
                <ChefHat className="w-56 h-56" />
              </div>

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3.5 py-1 rounded-full text-xs font-semibold mb-4 border border-blue-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Quality Standards</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
                  Partner Requirements
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8 max-w-xl">
                  To ensure our subscribers enjoy the highest culinary hygiene
                  and taste, every kitchen must meet the following baseline
                  criteria:
                </p>

                <ul className="space-y-4 mb-8">
                  {requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm text-slate-200 leading-relaxed">
                        {req}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="pt-6 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-slate-400">
                    Questions? Reach our onboarding team at{" "}
                    <span className="text-blue-400 font-medium">
                      support@tiffinhub.com
                    </span>
                  </div>
                  <Link
                    to="/provider/register"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-3 rounded-full shadow-lg transition-all"
                  >
                    <span>Start Your Application</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
