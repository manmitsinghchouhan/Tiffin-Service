import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [providerStage, setProviderStage] = useState(null);
  const [providerProfile, setProviderProfile] = useState(null);

  // Clean up any legacy localStorage items if present
  useEffect(() => {
    localStorage.removeItem('customerUser');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('providerUser');
  }, []);

  /**
   * On initial app load or page refresh:
   * Verify session securely via protected /me endpoints using HTTP-only cookies
   */
  const checkAuth = useCallback(async () => {
    setLoading(true);
    const pathname = window.location.pathname;

    try {
      // 1. If currently on an admin path, verify admin first
      if (pathname.startsWith('/admin')) {
        try {
          const { data } = await api.get('/admin/me');
          if (data.success && data.data?.admin) {
            setUser(data.data.admin);
            setProviderStage(null);
            setProviderProfile(null);
            return;
          }
        } catch {
          // Admin session not active, fall through
        }
      }

      // 2. If currently on a provider path, verify provider first
      if (pathname.startsWith('/provider') || pathname.startsWith('/partner')) {
        try {
          const { data } = await api.get('/provider/me');
          if (data.success && data.data?.user) {
            setUser(data.data.user);
            setProviderStage(data.data.stage || 'NEEDS_PROFILE');
            setProviderProfile(data.data.providerProfile || null);
            return;
          }
        } catch {
          // Provider session not active, fall through
        }
      }

      // 3. Check customer session
      try {
        const { data } = await api.get('/customer/me');
        if (data.success && data.data?.user) {
          setUser(data.data.user);
          setProviderStage(null);
          setProviderProfile(null);
          return;
        }
      } catch {
        // Customer session not active
      }

      // 4. Fallback check for provider session if not on provider path
      try {
        const { data } = await api.get('/provider/me');
        if (data.success && data.data?.user) {
          setUser(data.data.user);
          setProviderStage(data.data.stage || 'NEEDS_PROFILE');
          setProviderProfile(data.data.providerProfile || null);
          return;
        }
      } catch {
        // Neither session active
      }

      // If no valid session
      setUser(null);
      setProviderStage(null);
      setProviderProfile(null);
    } catch {
      setUser(null);
      setProviderStage(null);
      setProviderProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Customer Login
   */
  const loginCustomer = async (email, password) => {
    const { data } = await api.post('/customer/login', { email, password });
    if (data.data?.user) {
      setUser(data.data.user);
      setProviderStage(null);
      setProviderProfile(null);
    }
    return data;
  };

  /**
   * Customer Register (registers account without setting cookie, ready for login)
   */
  const registerCustomer = async (customerData) => {
    const { data } = await api.post('/customer/register', customerData);
    return data;
  };

  /**
   * Customer Logout
   */
  const logoutCustomer = async () => {
    try {
      await api.post('/customer/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setProviderStage(null);
      setProviderProfile(null);
    }
  };

  /**
   * Provider Login
   */
  const loginProvider = async (email, password) => {
    const { data } = await api.post('/provider/login', { email, password });
    if (data.data?.user) {
      setUser(data.data.user);
      setProviderStage(data.data.stage || 'NEEDS_PROFILE');
      setProviderProfile(data.data.providerProfile || null);
    }
    return data;
  };

  /**
   * Provider Register (Step 1: Creates account AND sets session cookie immediately)
   */
  const registerProvider = async (providerData) => {
    const { data } = await api.post('/provider/register', providerData);
    if (data.data?.user) {
      setUser(data.data.user);
      setProviderStage(data.data.onboardingStatus || 'NEEDS_PROFILE');
      setProviderProfile(null);
    }
    return data;
  };

  /**
   * Provider Logout
   */
  const logoutProvider = async () => {
    try {
      await api.post('/provider/logout');
    } catch (err) {
      console.error('Provider logout error:', err);
    } finally {
      setUser(null);
      setProviderStage(null);
      setProviderProfile(null);
    }
  };

  /**
   * Provider Onboarding (Step 2: Submits business details and sets status to PENDING_APPROVAL)
   */
  const submitOnboarding = async (onboardingData) => {
    const { data } = await api.post('/provider/onboarding', onboardingData);
    if (data.data?.providerProfile) {
      setProviderProfile(data.data.providerProfile);
      setProviderStage(data.data.stage || 'PENDING_APPROVAL');
    }
    return data;
  };

  /**
   * Admin Login
   */
  const loginAdmin = async (email, password) => {
    const { data } = await api.post('/admin/login', { email, password });
    if (data.data?.admin) {
      setUser(data.data.admin);
      setProviderStage(null);
      setProviderProfile(null);
    }
    return data;
  };

  /**
   * Admin Logout
   */
  const logoutAdmin = async () => {
    try {
      await api.post('/admin/logout');
    } catch (err) {
      console.error('Admin logout error:', err);
    } finally {
      setUser(null);
      setProviderStage(null);
      setProviderProfile(null);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    role: user?.role || null,
    isCustomer: user?.role === 'CUSTOMER',
    isAdmin: user?.role === 'ADMIN',
    isProvider: user?.role === 'PROVIDER',
    providerStage,
    providerProfile,
    setProviderStage,
    setProviderProfile,
    loginCustomer,
    registerCustomer,
    logoutCustomer,
    loginProvider,
    registerProvider,
    logoutProvider,
    submitOnboarding,
    loginAdmin,
    logoutAdmin,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
