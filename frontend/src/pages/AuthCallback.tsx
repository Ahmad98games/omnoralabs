import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { CinematicLoader } from '../components/ui/CinematicLoader';

const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const { user, profile, isInitialized } = useAuth();

    useEffect(() => {
        // Wait for auth initialization to complete
        if (isInitialized) {
            if (!user) {
                console.error('[AuthCallback] Session Error: No authenticated user');
                navigate('/login?error=auth_callback_failed', { replace: true });
                return;
            }

            // Await full hydration of the user profile from AuthContext
            if (profile) {
                // Priority: Use the resolved profile role, defaulting to customer
                const targetRole = profile.metadata?.role || 'customer';
                console.log(`[AuthCallback] Terminal Intent for ${user.email}: ${targetRole}`);

                // Clean up transition state
                localStorage.removeItem('omnora_selected_role');

                if (targetRole === 'admin' || targetRole === 'super-admin') {
                    navigate('/admin/dashboard', { replace: true });
                } else if (targetRole === 'seller') {
                    // Force builder tab for sellers to ensure they land in the right place
                    navigate('/seller/dashboard?tab=builder', { replace: true });
                } else {
                    navigate('/', { replace: true });
                }
            }
        }
    }, [navigate, user, profile, isInitialized]);

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100vh', 
            background: '#000000', 
            color: '#FFFFFF', 
            gap: '32px' 
        }}>
            <CinematicLoader />
            <div style={{ 
                fontFamily: 'Inter, sans-serif', 
                fontSize: '10px', 
                fontWeight: '900', 
                letterSpacing: '5px', 
                color: 'rgba(255,255,255,0.2)', 
                textTransform: 'uppercase' 
            }}>
                Establishing Secure Session
            </div>
        </div>
    );
};

export default AuthCallback;
