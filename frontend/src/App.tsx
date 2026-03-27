import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { HostnameInterceptor } from './components/HostnameInterceptor';
import { ToastProvider } from './context/ToastContext';
import { AuthModal } from './components/auth/AuthModal';
import { CartDrawer } from './components/storefront/CartDrawer';
import { CinematicLoader } from './components/ui/CinematicLoader';
import { ThankYouPage } from './components/storefront/ThankYouPage';

import { Routes, Route, useLocation, Outlet, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { RenderPipelineProvider } from './context/RenderPipelineContext';
import { RenderPipelineOverlay } from './components/ui/RenderPipelineOverlay';
import Home from './pages/HomeWithAds';
import Collection from './pages/Collection';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import About from './pages/About';
import Login from './pages/Login';
import Profile from './components/storefront/CustomerProfile';
import AdminDashboard from './pages/AdminDashboard';
import OmnoraContact from './pages/OmnoraContact';
import { BuilderHelpPage } from './pages/builder/BuilderHelpPage';
import SellerDashboard from './pages/SellerDashboard';
import { ROUTES } from './routes';

import client from './api/client';

const token = localStorage.getItem('token');
if (token) {
  client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Hardened Cache Configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute: Data remains fresh for 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes: Garbage collect after 5 minutes of inactivity
      retry: false, 
      refetchOnWindowFocus: false, 
    },
  },
});

export default function App() {
  console.log('[Boot] App rendering');
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <RenderPipelineProvider>
            <ThemeProvider>
              <AuthProvider>
              <HostnameInterceptor>
                <ToastProvider>
                  <AuthModal />
                  <RenderPipelineOverlay />
                    <Suspense fallback={<CinematicLoader />}>
                    <Routes>
                        {/* 🛍️ Storefront Layout Scope */}
                        <Route element={<Layout children={<Outlet />} />}>
                          <Route path={ROUTES.HOME} element={<Home />} />
                          <Route path={ROUTES.COLLECTION} element={<Collection />} />
                          <Route path={ROUTES.PRODUCT} element={<Product />} />
                          <Route path={ROUTES.CART} element={<Cart />} />
                          <Route path={ROUTES.CHECKOUT} element={<Checkout />} />
                          <Route path={ROUTES.ABOUT} element={<About onBack={() => window.history.back()} />} />
                          <Route path={ROUTES.CONTACT} element={<OmnoraContact />} />
                          <Route path={ROUTES.THANK_YOU} element={<ThankYouPage />} />
                          <Route path={ROUTES.PROFILE} element={<Profile />} />
                          <Route path={ROUTES.BUILDER_HELP} element={<BuilderHelpPage />} />
                        </Route>

                        {/* 🛠️ Dashboard & Auth (No Storefront Header Layout Wrap) */}
                        <Route path={ROUTES.LOGIN} element={<Login />} />
                        <Route path={ROUTES.REGISTER} element={<Login />} /> 
                        <Route path={ROUTES.ADMIN} element={<AdminDashboard />} />
                        <Route path={ROUTES.SELLER} element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
                        <Route path="/builder" element={<ProtectedRoute><Navigate to="/seller?tab=builder" replace /></ProtectedRoute>} />
                        
                        {/* Google OAuth Callback — Supabase processes tokens via onAuthStateChange */}
                        <Route path="/auth/callback" element={
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#050505', color: '#F1D592', fontFamily: 'serif', fontSize: '18px' }}>
                                Authenticating...
                            </div>
                        } />

                        {/* Fallback */}
                        <Route path="*" element={<Home />} />
                    </Routes>
                  </Suspense>
                </ToastProvider>
              </HostnameInterceptor>
            </AuthProvider>
            </ThemeProvider>
          </RenderPipelineProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}
