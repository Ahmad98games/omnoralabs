import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RequireAdminProps {
    children: React.ReactNode;
}

export default function RequireAdmin({ children }: RequireAdminProps) {
    const { user, loading } = useAuth();
    const location = useLocation();

    // 1. Loading State
    if (loading) {
        return <div className="loading-screen">Verifying Admin Privileges...</div>;
    }

    // 2. Strict Access Control
    if (!user || user.role !== 'admin') {
        console.warn('Unauthorized Admin Access Attempt');
        // Redirect non-admins to the root Landing Page and trigger the Auth Modal
        return <Navigate to="/" replace state={{ requireAuth: true, from: location }} />;
    }

    // 3. Access Granted
    return <>{children}</>;
}
