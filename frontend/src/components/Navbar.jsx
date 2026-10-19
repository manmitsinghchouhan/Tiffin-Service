import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Menu, X, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isCustomer, logoutCustomer } = useAuth();


  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              {/* Tiffin Dabba Icon SVG */}
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 3h6M12 3v3" />
                <rect x="5" y="6" width="14" height="4" rx="2" />
                <rect x="5" y="11" width="14" height="4" rx="2" />
                <rect x="5" y="16" width="14" height="4" rx="2" />
                <path d="M4 8v10M20 8v10" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                Tiffin<span className="text-blue-600">Hub</span>
              </span>
              <span className="text-[11px] font-medium text-slate-400 tracking-wider">
                Good Food. Better Days.
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-10">
            <Link 
              to="/" 
              className="text-sm font-semibold text-blue-600 relative py-1 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600 after:rounded-full"
            >
              Home
            </Link>
            <a 
              href="#subscription" 
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors py-1"
            >
              Subscription
            </a>
            
            {/* Customer Auth / Profile Link */}
            {isCustomer && user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                  <span>{user.name?.split(' ')[0] || 'Customer'}</span>
                </div>
                <button
                  type="button"
                  onClick={logoutCustomer}
                  className="text-xs font-medium text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors py-1 cursor-pointer"
              >
                Login
              </Link>
            )}
          </nav>

          {/* Right Action: Become a Provider */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/partner"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-full shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>Become a Provider</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/98 px-6 pt-4 pb-6 space-y-3 animate-fadeIn">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-semibold text-blue-600 py-2 border-l-2 border-blue-600 pl-3"
          >
            Home
          </Link>
          <a
            href="#subscription"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-medium text-slate-600 hover:text-blue-600 py-2 pl-3"
          >
            Subscription
          </a>

          {isCustomer && user ? (
            <div className="py-2 pl-3 space-y-2 border-t border-slate-100">
              <div className="text-sm font-semibold text-slate-800">
                Logged in as <span className="text-blue-600">{user.name}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  logoutCustomer();
                  setMobileMenuOpen(false);
                }}
                className="text-sm font-medium text-red-500 hover:text-red-700 flex items-center gap-2 py-1 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-slate-600 hover:text-blue-600 py-2 pl-3"
            >
              Login
            </Link>
          )}

          <div className="pt-2">
            <Link
              to="/partner"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-full shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <span>Become a Provider</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
