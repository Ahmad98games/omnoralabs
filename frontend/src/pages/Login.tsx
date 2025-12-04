import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

// Canvas animation is handled globally via script in index.html or can be re-initialized here if needed.

const Login: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { login, loginWithGoogle, register, resetPassword, isAuthenticated, user, loading } = useAuth();

    // Determine if we are in sign‑up mode based on navigation state or default to sign‑in
    const initialSignUp = (location.state as any)?.isSignUp ?? false;
    const [isSignUp, setIsSignUp] = useState<boolean>(initialSignUp);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const [forgotEmail, setForgotEmail] = useState('');
    const [showForgot, setShowForgot] = useState(false);
    const [error, setError] = useState<string>('');
    const [loadingState, setLoadingState] = useState(false);

    // Redirect authenticated users to profile or home
    useEffect(() => {
        if (isAuthenticated && user) {
            navigate('/profile');
        }
    }, [isAuthenticated, user, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoadingState(true);
        try {
            if (isSignUp) {
                // Register flow
                await register(formData.name, formData.email, formData.password);
                // After registration, AuthContext will set user and redirect
            } else {
                // Login flow
                await login(formData.email, formData.password);
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoadingState(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setLoadingState(true);
        try {
            await loginWithGoogle();
        } catch (err: any) {
            setError(err.message || 'Google sign‑in failed');
        } finally {
            setLoadingState(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!forgotEmail) {
            setError('Please enter your email address');
            return;
        }
        setError('');
        setLoadingState(true);
        try {
            await resetPassword(forgotEmail);
            alert('Password reset email sent');
            setShowForgot(false);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setLoadingState(false);
        }
    };

    const toggleMode = () => {
        setIsSignUp(prev => !prev);
        setError('');
    };

    return (
        <div className="login-page" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--background-dark) 0%, var(--background-card) 100%)',
            padding: '2rem'
        }}>
            <div className="login-card" style={{
                background: 'var(--background-card)',
                padding: '3rem',
                borderRadius: '1rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                width: '100%',
                maxWidth: '450px',
                border: '1px solid var(--border-color)'
            }}>
                <div className="text-center mb-8" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{
                        fontFamily: '"Playfair Display", serif',
                        fontSize: '2.5rem',
                        color: 'var(--text-primary)',
                        marginBottom: '0.5rem'
                    }}>
                        {isSignUp ? 'Join Omnora' : 'Welcome Back'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {isSignUp ? 'Begin your journey to serenity' : 'Sign in to access your sanctuary'}
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(255, 107, 107, 0.1)',
                        border: '1px solid #FF6B6B',
                        color: '#FF6B6B',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1.5rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {isSignUp && (
                        <div className="form-group">
                            <label style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="form-input"
                                style={{
                                    width: '100%',
                                    padding: '0.9rem 1.2rem',
                                    background: 'var(--background-light)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '0.5rem',
                                    color: 'var(--text-primary)',
                                    fontSize: '1rem'
                                }}
                                placeholder="Enter your name"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="form-input"
                            style={{
                                width: '100%',
                                padding: '0.9rem 1.2rem',
                                background: 'var(--background-light)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '0.5rem',
                                color: 'var(--text-primary)',
                                fontSize: '1rem'
                            }}
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Password</label>
                        <input
                            type="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="form-input"
                            style={{
                                width: '100%',
                                padding: '0.9rem 1.2rem',
                                background: 'var(--background-light)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '0.5rem',
                                color: 'var(--text-primary)',
                                fontSize: '1rem'
                            }}
                            placeholder="Enter your password"
                        />
                    </div>

                    {!isSignUp && (
                        <div style={{ textAlign: 'right' }}>
                            <button
                                type="button"
                                onClick={() => setShowForgot(true)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Forgot password?
                            </button>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loadingState}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            background: 'linear-gradient(135deg, var(--aqua-400) 0%, var(--aqua-600) 100%)',
                            color: 'var(--background-dark)',
                            border: 'none',
                            cursor: loadingState ? 'not-allowed' : 'pointer',
                            opacity: loadingState ? 0.7 : 1,
                            marginTop: '0.5rem'
                        }}
                    >
                        {loadingState ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
                    </button>
                </form>

                {showForgot && (
                    <div className="forgot-section" style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--background-light)', borderRadius: '0.5rem' }}>
                        <input
                            type="email"
                            placeholder="Enter email for reset"
                            value={forgotEmail}
                            onChange={e => setForgotEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.8rem',
                                marginBottom: '0.5rem',
                                borderRadius: '0.3rem',
                                border: '1px solid var(--border-color)',
                                background: 'var(--background-card)',
                                color: 'var(--text-primary)'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={handleForgotPassword}
                                disabled={loadingState}
                                style={{ flex: 1, padding: '0.5rem', background: 'var(--aqua-400)', border: 'none', borderRadius: '0.3rem', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Send Link
                            </button>
                            <button
                                onClick={() => setShowForgot(false)}
                                disabled={loadingState}
                                style={{ flex: 1, padding: '0.5rem', background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)', borderRadius: '0.3rem', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-8 text-center" style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                        <button
                            onClick={toggleMode}
                            style={{ marginLeft: '0.5rem', color: 'var(--aqua-400)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </div>

                {!isSignUp && (
                    <div className="mt-4 text-center" style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                            <span style={{ color: 'var(--text-secondary)' }}>OR</span>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                        </div>
                        <button
                            onClick={handleGoogleSignIn}
                            style={{
                                width: '100%',
                                padding: '0.8rem',
                                borderRadius: '0.5rem',
                                background: 'transparent',
                                border: '1px solid var(--text-secondary)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                fontWeight: 500
                            }}
                        >
                            <span style={{ fontWeight: 'bold', color: '#4285F4' }}>G</span> Sign in with Google
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;