import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Loader2 } from 'lucide-react';

export const SuperAdminRoute: React.FC = () => {
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        const verifySuperAdmin = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const superAdminEmail = import.meta.env.VITE_SUPERADMIN_EMAIL;

            if (!session?.user || !superAdminEmail) {
                console.warn("[SuperAdminRoute] No session or VITE_SUPERADMIN_EMAIL not set.");
                setIsAuthorized(false);
                return;
            }

            if (session.user.email === superAdminEmail) {
                setIsAuthorized(true);
            } else {
                console.warn(`[SECURITY] Unauthorized God Mode access attempt by: ${session.user.email}`);
                setIsAuthorized(false);
            }
        };

        verifySuperAdmin();
    }, []);

    if (isAuthorized === null) {
        return (
            <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f' }}>
                <Loader2 className="spin" color="#7c6dfa" size={40} />
                <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return isAuthorized ? <Outlet /> : <Navigate to="/" replace />;
};
