import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { HostnameInterceptor } from './components/HostnameInterceptor';
import { ToastProvider } from './context/ToastContext';
import { AuthModal } from './components/auth/AuthModal';
import { CartDrawer } from './components/storefront/CartDrawer';
import { CinematicLoader } from './components/ui/CinematicLoader';

import { Routes, Route, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import Home from './pages/HomeWithAds';
import Collection from './pages/Collection';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import About from './pages/About';
import Login from './pages/Login';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import SellerDashboard from './pages/SellerDashboard';
import { ThankYouPage } from './components/storefront/ThankYouPage';

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
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <HostnameInterceptor>
                <ToastProvider>
                  <AuthModal />
                  <CartDrawer />
                  <Suspense fallback={<CinematicLoader />}>
                    <Routes>
                      <Route element={<Layout children={<Outlet />} />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/collection" element={<Collection />} />
                        <Route path="/product/:id" element={<Product />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/about" element={<About onBack={() => window.history.back()} />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Login />} /> {/* Login handles both */}
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/admin/*" element={<AdminDashboard />} />
                        <Route path="/seller/*" element={<SellerDashboard />} />
                        <Route path="/thank-you" element={<ThankYouPage />} />
                        <Route path="*" element={<Home />} />
                      </Route>
                    </Routes>
                  </Suspense>
                </ToastProvider>
              </HostnameInterceptor>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </HelmetProvider>
    </QueryClientProvider>
  );
}
