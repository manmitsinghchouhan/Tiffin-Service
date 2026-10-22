import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProviders from './pages/admin/AdminProviders';
import AdminUsers from './pages/admin/AdminUsers';
import CustomerAuth from './pages/CustomerAuth';
import CustomerDashboard from './pages/CustomerDashboard';
import PartnerLandingPage from './pages/PartnerLandingPage';
import ProviderAuth from './pages/ProviderAuth';
import ProviderOnboarding from './pages/ProviderOnboarding';
import ProviderStatus from './pages/ProviderStatus';
import ProviderDashboard from './pages/ProviderDashboard';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Provider / Partner Onboarding Landing Page */}
          <Route path="/partner" element={<PartnerLandingPage />} />
          <Route path="/provider" element={<Navigate to="/partner" replace />} />

          {/* Provider Authentication Flow (Step 1) */}
          <Route path="/provider/register" element={<ProviderAuth initialMode="register" />} />
          <Route path="/provider/login" element={<ProviderAuth initialMode="login" />} />

          {/* Provider Onboarding Wizard (Step 2) */}
          <Route path="/provider/onboarding" element={<ProviderOnboarding />} />

          {/* Provider Application Status ("Pending Approval" / "Milestone" / "Rejected") */}
          <Route path="/provider/status" element={<ProviderStatus />} />

          {/* Provider Active Kitchen Dashboard, Weekly Menu, Tiffin Plans & Subscriptions */}
          <Route path="/provider/dashboard" element={<ProviderDashboard />} />
          <Route path="/provider/menu" element={<ProviderDashboard initialTab="weekly-menu" />} />
          <Route path="/provider/plans" element={<ProviderDashboard initialTab="tiffin-plans" />} />
          <Route path="/provider/subscriptions" element={<ProviderDashboard initialTab="subscriptions" />} />

          {/* Customer Authentication & Dashboard */}
          <Route path="/login" element={<CustomerAuth initialMode="login" />} />
          <Route path="/register" element={<CustomerAuth initialMode="register" />} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/subscriptions" element={<Navigate to="/customer/dashboard" replace />} />

          {/* Admin Authentication & Management Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/providers" element={<AdminProviders />} />
          <Route path="/admin/users" element={<AdminUsers />} />

          {/* Catch-all redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
