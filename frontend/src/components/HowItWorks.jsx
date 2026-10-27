import React from "react";
import step1Img from "../assets/step-1-discover.png";
import step2Img from "../assets/step-2-Menu.png";
import step3Img from "../assets/step-3-Approval.png";

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
      image: step2Img,
    },
    {
      number: 3,
      title: "Place Order",
      titleHighlight: " or Subscribe",
      description: "Place a one-time order or subscribe for regular meals.",
      image: step3Img,
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-20 lg:py-28 bg-[#fafcff] relative overflow-hidden"
    >
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
            Getting your favourite tiffin service is simple. Follow these easy
            steps and enjoy hassle-free meals.
          </p>
        </div>

        {/* 3 Step Cards Grid */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 items-stretch">
          {/* Connecting Curved Dashed Arrow between Card 1 and 2 (Desktop only) */}
          <div className="hidden md:block absolute top-[40%] lg:top-[42%] left-[33.3%] -translate-x-1/2 -translate-y-1/2 w-16 lg:w-20 h-8 pointer-events-none z-20">
            <svg
              viewBox="0 0 76 26"
              fill="none"
              className="w-full h-full text-blue-400 drop-shadow-sm"
            >
              {/* Smooth Curved Dashed Body */}
              <path
                d="M 4 18 Q 36 4 63 12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray="4 4"
                strokeLinecap="round"
              />
              {/* Crisp Solid Arrow Head */}
              <path
                d="M 73 15 L 62 8 L 64 13 L 62 18 Z"
                fill="currentColor"
              />
            </svg>
          </div>

          {/* Connecting Curved Dashed Arrow between Card 2 and 3 (Desktop only) */}
          <div className="hidden md:block absolute top-[40%] lg:top-[42%] left-[66.7%] -translate-x-1/2 -translate-y-1/2 w-16 lg:w-20 h-8 pointer-events-none z-20">
            <svg
              viewBox="0 0 76 26"
              fill="none"
              className="w-full h-full text-blue-400 drop-shadow-sm"
            >
              {/* Smooth Curved Dashed Body */}
              <path
                d="M 4 18 Q 36 4 63 12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray="4 4"
                strokeLinecap="round"
              />
              {/* Crisp Solid Arrow Head */}
              <path
                d="M 73 15 L 62 8 L 64 13 L 62 18 Z"
                fill="currentColor"
              />
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
                    <span className="text-blue-600 font-semibold">
                      {step.titleHighlight}
                    </span>
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
