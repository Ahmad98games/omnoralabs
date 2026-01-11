import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ShieldCheck } from 'lucide-react';
import './ProtectedRoute.css';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
    const { isAuthenticated, isAdmin, loading } = useAuth();
    const location = useLocation();

    // 1. SECURITY SCAN (Loading State)
    if (loading) {
        return (
            <div className="security-gate">
                <div className="scanner-ui">
                    <div className="scanner-icon">
                        <Loader2 size={40} className="animate-spin" />
                    </div>
                    <div className="scanner-status">
                        <span className="blink-text">VERIFYING CREDENTIALS</span>
                        <div className="scanner-bar"></div>
                    </div>
                </div>
            </div>
        );
    }

    // 2. ACCESS DENIED (Not Logged In)
    if (!isAuthenticated) {
        // Redirect to login, but save the current location they were trying to access
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. INSUFFICIENT CLEARANCE (Not Admin)
    if (requireAdmin && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    // 4. ACCESS GRANTED
    return <>{children}</>;
}