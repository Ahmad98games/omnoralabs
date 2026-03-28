import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { CinematicLoader } from '../components/ui/CinematicLoader';

const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth() || {};

    useEffect(() => {
        const handleCallback = async () => {
            const { data, error } = await supabase.auth.getSession();
            
            if (error || !data.session) {
                console.error('[AuthCallback] Session Error:', error);
                navigate('/login?error=auth_callback_failed');
                return;
            }

            const sbUser = data.session.user;
            
            // 🔄 STRATEGY: Determine true intent using DB + Metadata + LocalStorage
            const { data: merchant } = await supabase.from('merchants').select('role').eq('id', sbUser.id).single();
            const { data: customer } = await supabase.from('customers').select('id').eq('id', sbUser.id).single();
            
            const savedRole = localStorage.getItem('omnora_selected_role');
            const targetRole = merchant?.role || (customer ? 'customer' : null) || sbUser.user_metadata?.role || savedRole || 'customer';

            console.log(`[AuthCallback] Terminal Intent for ${sbUser.email}: ${targetRole}`);

            // 🚀 Force route based on targetRole (AuthProvider will catch up on profile)
            if (targetRole === 'admin' || targetRole === 'super-admin') {
                navigate('/admin/dashboard');
            } else if (targetRole === 'seller') {
                navigate('/seller/dashboard?tab=builder');
            } else {
                navigate('/');
            }
        };

        handleCallback();
    }, [navigate]);

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
