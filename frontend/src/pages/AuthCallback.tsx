import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CinematicLoader } from '../components/ui/CinematicLoader';

/**
 * AuthCallback — OAuth redirect landing page.
 *
 * BUG this fixed: if ensureProfile() returned null (any DB/network failure),
 * `profile` was never set. The useEffect only navigated inside `if (profile)`,
 * so when profile was null the component rendered CinematicLoader indefinitely
 * with no escape route — the user was permanently stuck.
 *
 * Fix:
 *   - Happy path:  user + profile both available → navigate by role immediately
 *   - Profile null: wait max 8s then navigate by role derived from user metadata
 *     (the role the user selected pre-OAuth is stored in localStorage)
 *   - No user at all: redirect to login with error
 */
const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const { user, profile, isInitialized } = useAuth();

    useEffect(() => {
        if (!isInitialized) return;

        // No session at all → auth flow failed, send back to login
        if (!user) {
            console.error('[AuthCallback] No authenticated user after initialization.');
            navigate('/login?error=auth_callback_failed', { replace: true });
            return;
        }

        // Profile resolved → navigate immediately
        if (profile) {
            const role = profile.role || 'customer';
            console.log(`[AuthCallback] Profile resolved. Role: ${role}`);
            localStorage.removeItem('omnora_selected_role');

            if (role === 'admin' || role === 'super-admin') {
                navigate('/admin/dashboard', { replace: true });
            } else if (role === 'seller') {
                navigate('/seller/dashboard?tab=builder', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        }
        // If profile is null: the timeout below will handle fallback navigation.
    }, [navigate, user, profile, isInitialized]);

    // ─── Fallback: profile never arrived ─────────────────────────────────────
    // Give ensureProfile up to 8 seconds. If it hasn't resolved by then,
    // derive role from localStorage or user metadata and navigate anyway.
    // This prevents permanent stuck-loading when the DB is slow or RLS blocks.
    useEffect(() => {
        if (!isInitialized || !user || profile) return;

        const fallbackTimeout = setTimeout(() => {
            console.warn('[AuthCallback] Profile hydration timeout. Navigating by metadata fallback.');
            const savedRole = localStorage.getItem('omnora_selected_role')
                || (user.user_metadata?.role as string)
                || 'customer';

            localStorage.removeItem('omnora_selected_role');

            if (savedRole === 'admin' || savedRole === 'super-admin') {
                navigate('/admin/dashboard', { replace: true });
            } else if (savedRole === 'seller') {
                navigate('/seller/dashboard?tab=builder', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        }, 8000);

        return () => clearTimeout(fallbackTimeout);
    }, [isInitialized, user, profile, navigate]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#000000',
            color: '#FFFFFF',
            gap: '32px',
        }}>
            <CinematicLoader />
            <div style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '10px',
                fontWeight: '900',
                letterSpacing: '5px',
                color: 'rgba(255,255,255,0.2)',
                textTransform: 'uppercase',
            }}>
                Establishing Secure Session
            </div>
        </div>
    );
};

export default AuthCallback;