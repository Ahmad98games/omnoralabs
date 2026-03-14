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
import { ThankYouPage } from './components/storefront/ThankYouPage';

import { Routes, Route, useLocation, Outlet } from 'react-router-dom';
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
import OmnoraContact from './pages/OmnoraContact';
import { BuilderHelpPage } from './pages/builder/BuilderHelpPage';
import SellerDashboard from './pages/SellerDashboard';
import { ROUTES } from './routes';

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
                        <Route path={ROUTES.HOME} element={<Home />} />
                        <Route path={ROUTES.COLLECTION} element={<Collection />} />
                        <Route path={ROUTES.PRODUCT} element={<Product />} />
                        <Route path={ROUTES.CART} element={<Cart />} />
                        <Route path={ROUTES.CHECKOUT} element={<Checkout />} />
                        <Route path={ROUTES.ABOUT} element={<About onBack={() => window.history.back()} />} />
                        <Route path={ROUTES.CONTACT} element={<OmnoraContact />} />
                        <Route path={ROUTES.BUILDER_HELP} element={<BuilderHelpPage />} />
                        <Route path={ROUTES.LOGIN} element={<Login />} />
                        <Route path={ROUTES.REGISTER} element={<Login />} /> 
                        <Route path={ROUTES.PROFILE} element={<Profile />} />
                        <Route path={ROUTES.ADMIN} element={<AdminDashboard />} />
                        <Route path={ROUTES.SELLER} element={<SellerDashboard />} />
                        <Route path={ROUTES.THANK_YOU} element={<ThankYouPage />} />
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
