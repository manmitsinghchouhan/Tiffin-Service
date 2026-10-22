import React from 'react';
import { Search, ArrowRight, Play, Users, Package, ShoppingBag, Sparkles } from 'lucide-react';
import heroTiffinImg from '../assets/hero-tiffin.jpg';

export default function Hero() {
  const scrollToHowItWorks = (e) => {
    e.preventDefault();
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f0f6ff] via-[#f7faff] to-white pt-10 pb-20 lg:pt-14 lg:pb-28">
      {/* Decorative Background Leaves */}
      <div className="absolute top-12 left-4 w-28 h-28 opacity-30 pointer-events-none text-blue-300">
        <svg viewBox="0 0 100 100" fill="currentColor">
          <path d="M10,80 Q30,10 80,10 Q90,50 30,85 Z" />
        </svg>
      </div>
      <div className="absolute top-28 left-[45%] w-16 h-16 opacity-35 pointer-events-none text-blue-400">
        <svg viewBox="0 0 100 100" fill="currentColor">
          <path d="M10,80 Q30,10 80,10 Q90,50 30,85 Z" />
        </svg>
      </div>
      <div className="absolute bottom-16 right-10 w-24 h-24 opacity-25 pointer-events-none text-blue-300">
        <svg viewBox="0 0 100 100" fill="currentColor">
          <path d="M20,90 Q40,20 90,20 Q100,60 40,95 Z" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Text & CTAs & Stats */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 bg-[#dbeafe]/80 border border-blue-200/60 text-blue-700 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Fresh • Home-Style • Trusted</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-5">
              Homely Meals, <br />
              <span className="text-blue-600">For Your Everyday</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-xl">
              Discover trusted tiffin service providers near you. Choose meal plans that fit your lifestyle and enjoy healthy, home-cooked food every day.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-12 w-full sm:w-auto">
              {/* Primary Explore CTA */}
              <a
                href="#subscription"
                className="inline-flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-full shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/35 transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm sm:text-base"
              >
                <Search className="w-4 h-4" />
                <span>Explore Tiffin Services</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              {/* Secondary How It Works Button */}
              <button
                type="button"
                onClick={scrollToHowItWorks}
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-6 py-3.5 rounded-full border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all text-sm sm:text-base cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Play className="w-3 h-3 fill-blue-600 ml-0.5" />
                </div>
                <span>How It Works</span>
              </button>
            </div>

            {/* Metrics & Social Proof */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-6 border-t border-slate-200/70 w-full max-w-lg">
              {/* Stat 1 */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">100+</div>
                  <div className="text-xs text-slate-500 font-medium">Tiffin Providers</div>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">50+</div>
                  <div className="text-xs text-slate-500 font-medium">Tasty Meal Plans</div>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">1000+</div>
                  <div className="text-xs text-slate-500 font-medium">Happy Customers</div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Tiffin Image Display */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
            <div className="relative group max-w-md lg:max-w-none">
              
              {/* Subtle back ambient glow */}
              <div className="absolute -inset-3 bg-gradient-to-tr from-blue-200/50 via-amber-100/40 to-blue-100/40 rounded-3xl blur-xl opacity-70 group-hover:opacity-90 transition duration-700"></div>
              
              {/* Image Frame */}
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border-4 border-white shadow-2xl shadow-slate-300/60 bg-white">
                <img
                  src={heroTiffinImg}
                  alt="Delicious Indian Tiffin Meal with dal, sabzi, rice, and chapatis"
                  className="w-full h-auto object-cover object-center max-h-[460px] transform group-hover:scale-[1.01] transition-transform duration-500"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>

              {/* Floating Quality Badge */}
              <div className="absolute -bottom-4 -left-4 bg-white/95 backdrop-blur-sm px-4 py-2.5 rounded-2xl shadow-lg border border-slate-100 hidden sm:flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900">100% Fresh Guaranteed</p>
                  <p className="text-[10px] text-slate-500">Prepared daily in certified kitchens</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
