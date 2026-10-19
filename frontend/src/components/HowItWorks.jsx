import React from 'react';
import step1Img from '../assets/step-1-discover.png';

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: "Discover a Tiffin Provider",
      titleHighlight: "",
      description: "Browse and explore verified tiffin service providers.",
      image: step1Img,
    },
    {
      number: 2,
      title: "Choose a Meal Plan",
      titleHighlight: "",
      description: "View plans, menus and select the one that fits you.",
      illustration: (
        <div className="relative w-44 h-36 mx-auto flex items-center justify-center">
          {/* Menu Card Mockup */}
          <div className="w-36 bg-white rounded-2xl p-3 border-2 border-blue-200 shadow-md shadow-blue-500/10">
            {/* Header bar: "TODAY'S MENU" */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span className="text-[9px] font-bold tracking-wider text-slate-800 uppercase">Today's Menu</span>
              </div>
              <div className="w-3 h-2 bg-slate-200 rounded-sm"></div>
            </div>

            {/* 4 Dish items grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* Dish 1 */}
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-amber-400 border border-amber-500 flex items-center justify-center shrink-0">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                </div>
                <div className="space-y-0.5">
                  <div className="w-6 h-1.5 bg-slate-200 rounded"></div>
                  <div className="w-4 h-1 bg-slate-100 rounded"></div>
                </div>
              </div>

              {/* Dish 2 */}
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-emerald-400 border border-emerald-500 flex items-center justify-center shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
                </div>
                <div className="space-y-0.5">
                  <div className="w-6 h-1.5 bg-slate-200 rounded"></div>
                  <div className="w-4 h-1 bg-slate-100 rounded"></div>
                </div>
              </div>

              {/* Dish 3 */}
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-orange-400 border border-orange-500 flex items-center justify-center shrink-0">
                  <span className="w-2 h-2 rounded-full bg-orange-700"></span>
                </div>
                <div className="space-y-0.5">
                  <div className="w-6 h-1.5 bg-slate-200 rounded"></div>
                  <div className="w-4 h-1 bg-slate-100 rounded"></div>
                </div>
              </div>

              {/* Dish 4 */}
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-yellow-400 border border-yellow-500 flex items-center justify-center shrink-0">
                  <span className="w-2 h-2 rounded-full bg-yellow-600"></span>
                </div>
                <div className="space-y-0.5">
                  <div className="w-6 h-1.5 bg-slate-200 rounded"></div>
                  <div className="w-4 h-1 bg-slate-100 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      number: 3,
      title: "Place Order",
      titleHighlight: " or Subscribe",
      description: "Place a one-time order or subscribe for regular meals.",
      illustration: (
        <div className="relative w-44 h-36 mx-auto flex items-center justify-center">
          {/* Subtle soft backdrop shape */}
          <div className="absolute inset-0 bg-blue-50/80 rounded-2xl transform rotate-1"></div>

          {/* Happy Customer eating with thumbs up */}
          <svg viewBox="0 0 160 130" className="w-full h-full relative z-10" fill="none">
            {/* Person eating */}
            <g transform="translate(35, 15)">
              {/* Hair */}
              <path d="M45 15c-10 0-20 6-20 18 0 4 1 8 2 11 3-2 8-3 14-3 10 0 18 4 22 10 2-4 2-8 2-12 0-14-9-24-20-24z" fill="#0F172A" />
              {/* Face */}
              <circle cx="45" cy="35" r="16" fill="#FCD34D" />
              {/* Smile */}
              <path d="M40 40c2 4 8 4 10 0" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
              {/* Neck & Blue Shirt */}
              <path d="M40 50v6h10v-6" fill="#FBBF24" />
              <path d="M22 84c2-20 13-26 23-26s21 6 23 26H22z" fill="#2563EB" />
              {/* Meal bowl on table */}
              <ellipse cx="45" cy="80" rx="18" ry="7" fill="#CBD5E1" />
              <ellipse cx="45" cy="79" rx="16" ry="5" fill="#F59E0B" />
              {/* Fork/Spoon in hand */}
              <path d="M30 68l10 10" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Thumbs up badge */}
            <g transform="translate(108, 22)">
              <rect x="0" y="0" width="30" height="26" rx="8" fill="#3B82F6" filter="drop-shadow(0px 2px 5px rgba(37,99,235,0.3))" />
              {/* Speech pointer */}
              <path d="M6 25l-4 4v-4z" fill="#3B82F6" />
              {/* Thumbs Up Icon */}
              <path d="M11 18v-6a2 2 0 0 1 2-2h1l1-3a1.5 1.5 0 0 1 2.5 0v3h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-6a2.5 2.5 0 0 1-2.5-2z" fill="#FFFFFF" />
            </g>
          </svg>
        </div>
      )
    }
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-[#fafcff] relative overflow-hidden">
      
      {/* Decorative leaf shapes */}
      <div className="absolute top-10 left-6 w-20 h-20 opacity-20 pointer-events-none text-blue-400">
        <svg viewBox="0 0 100 100" fill="currentColor">
          <path d="M10,80 Q30,10 80,10 Q90,50 30,85 Z" />
        </svg>
      </div>
      <div className="absolute bottom-8 right-8 w-24 h-24 opacity-20 pointer-events-none text-blue-400">
        <svg viewBox="0 0 100 100" fill="currentColor">
          <path d="M20,90 Q40,20 90,20 Q100,60 40,95 Z" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block bg-blue-100/90 text-blue-700 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-3.5">
            SIMPLE STEPS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            How It <span className="text-blue-600">Works?</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Getting your favourite tiffin service is simple. Follow these easy steps and enjoy hassle-free meals.
          </p>
        </div>

        {/* 3 Step Cards Grid */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 items-stretch">
          
          {/* Connecting Curved Dashed Arrow between Card 1 and 2 (Desktop only) */}
          <div className="hidden md:block absolute top-[28%] left-[30%] w-[12%] h-8 pointer-events-none z-20">
            <svg viewBox="0 0 100 30" fill="none" className="w-full h-full text-blue-400">
              <path d="M5,15 Q50,0 95,15" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5,5" strokeLinecap="round" />
              <path d="M88,10 L96,15 L88,20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Connecting Curved Dashed Arrow between Card 2 and 3 (Desktop only) */}
          <div className="hidden md:block absolute top-[28%] left-[64%] w-[12%] h-8 pointer-events-none z-20">
            <svg viewBox="0 0 100 30" fill="none" className="w-full h-full text-blue-400">
              <path d="M5,15 Q50,0 95,15" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5,5" strokeLinecap="round" />
              <path d="M88,10 L96,15 L88,20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Cards */}
          {steps.map((step) => (
            <div
              key={step.number}
              className="group relative bg-white rounded-3xl p-7 sm:p-8 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Step Number Circle Badge */}
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-6 shadow-md shadow-blue-500/30">
                  {step.number}
                </div>

                {/* Illustration / Image Area */}
                <div className="mb-6 flex items-center justify-center h-44">
                  {step.image ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={step.image}
                        alt={step.title}
                        className="w-auto h-full max-h-44 object-contain hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    step.illustration
                  )}
                </div>

                {/* Content */}
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mb-2 text-center">
                  {step.title}
                  {step.titleHighlight && (
                    <span className="text-blue-600 font-semibold">{step.titleHighlight}</span>
                  )}
                </h3>
              </div>

              <p className="text-sm text-slate-500 text-center leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}
