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
                    {/* Routing is managed inside HostnameInterceptor based on domain */}
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
