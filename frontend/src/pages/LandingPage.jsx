import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import ExploreKitchens from '../components/ExploreKitchens';
import Footer from '../components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-700">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <HowItWorks />
        <ExploreKitchens />
      </main>
      <Footer />
    </div>
  );
}
