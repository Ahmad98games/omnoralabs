import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import './ProtectedRoute.css';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
    requireSeller?: boolean;
}

export default function ProtectedRoute({ 
    children, 
    requireAdmin = false,
    requireSeller = false 
}: ProtectedRouteProps) {
    const { isAuthenticated, isAdmin, isSeller, loading } = useAuth();
    const location = useLocation();

    // 1. SECURITY SCAN (Loading State)
    if (loading) {
        return (
            <div className="security-gate" style={{ background: '#000', color: '#fff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="scanner-ui">
                    <div className="scanner-icon">
                        <Loader2 size={40} className="animate-spin text-white/20" />
                    </div>
                    <div className="scanner-status">
                        <span className="text-xs tracking-[0.2em] font-black opacity-40">INITIALIZING_AUTH_SHIELD</span>
                    </div>
                </div>
            </div>
        );
    }

    // 2. ACCESS DENIED (Not Logged In)
    if (!isAuthenticated) {
        if (location.pathname.startsWith('/builder') || location.pathname.startsWith('/seller') || location.pathname.startsWith('/admin')) {
            return <Navigate to="/login" state={{ from: location }} replace />;
        }
        return <Navigate to="/" state={{ requireAuth: true, from: location }} replace />;
    }

    // 3. INSUFFICIENT CLEARANCE (Seller Check)
    if (requireSeller && !isSeller && !isAdmin) {
        console.warn('[Security] Access Denied: Seller role required');
        return <Navigate to="/" replace />;
    }

    // 4. INSUFFICIENT CLEARANCE (Admin Check)
    if (requireAdmin && !isAdmin) {
        console.warn('[Security] Access Denied: Admin role required');
        return <Navigate to="/" replace />;
    }

    // 4. ACCESS GRANTED
    return <>{children}</>;
}