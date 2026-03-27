
import React, { useEffect, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import client from '../api/client';

import './Login.css';
import './RoleSelector.css';



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
        password: '',
        role: 'customer'
    });

    const [selectedRole, setSelectedRole] = useState<'customer' | 'seller'>('customer');



    const [forgotEmail, setForgotEmail] = useState('');

    const [showForgot, setShowForgot] = useState(false);

    const [error, setError] = useState<string>('');

    const [loadingState, setLoadingState] = useState(false);



    // Redirect authenticated users to profile or home
    // Redirect logic is handled in handleSubmit to prevent infinite loops / wrong redirects
    /*
        useEffect(() => {
            if (isAuthenticated && user) {
                navigate('/profile');
            }
        }, [isAuthenticated, user, navigate]);
    */


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
            // 1. Register Flow
            await register(formData.name, formData.email, formData.password, selectedRole);
            
            // Imperial Logic: Direct redirect based on selection
            if (selectedRole === 'seller') {
                navigate('/seller/dashboard?tab=builder');
            } else {
                navigate('/profile');
            }
        } else {
            // 2. Login Flow
            const loggedUser = await login(formData.email, formData.password);

            if (loggedUser) {
                const role = loggedUser.role || 'customer';
                if (role === 'admin' || role === 'super-admin') {
                    navigate('/admin/dashboard');
                } else if (role === 'seller') {
                    navigate('/seller/dashboard?tab=builder');
                } else {
                    navigate('/profile');
                }
            }
        }
    } catch (err: any) {
        console.error("Auth Error:", err);
        let message = 'Access Denied. Please verify credentials.';
        if (err.response?.data?.message) {
            message = typeof err.response.data.message === 'object' ? JSON.stringify(err.response.data.message) : err.response.data.message;
        } else if (err.message) {
            message = typeof err.message === 'object' ? JSON.stringify(err.message) : err.message;
        }
        setError(message);
    } finally {
        setLoadingState(false);
    }
};

    const handleGoogleSignIn = async () => {
        setError('');
        setLoadingState(true);
        try {
            // 🛡️ Imperial Logic: Save selection before Google redirect for post-auth sync
            localStorage.setItem('omnora_selected_role', selectedRole);
            
            await loginWithGoogle();
            // Supabase will redirect to Google — no further code runs here
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

        <div className="login-luxury-page">
            <div className="login-visual-sidebar">
                <img src="/images/home/formal.png" alt="GSG Fashion" className="login-visual-img" />
                <div className="visual-overlay-gold" />
                <div className="visual-caption">
                    <span className="eyebrow">GSG ATELIER</span>
                    <h2 className="subtitle-serif text-white">Crafting Traditions</h2>
                </div>
            </div>

            <div className="login-auth-container animate-fade-in">
                <div className="login-auth-box">
                    <div className="login-auth-header text-center">
                        <span className="eyebrow">AUTHENTICATION</span>
                        <h1 className="subtitle-serif">{isSignUp ? 'Join the Legacy' : 'Atelier Access'}</h1>
                        <p className="text-muted italic">
                            {isSignUp ? 'Create your profile to explore custom craftsmanship.' : 'Enter your credentials to manage your selection.'}
                        </p>
                    </div>

                    <div className="role-selector-container">
                        <div className={`role-selector-backdrop ${selectedRole}`}></div>
                        <button
                            type="button"
                            className={`role-btn ${selectedRole === 'customer' ? 'active' : ''}`}
                            onClick={() => setSelectedRole('customer')}
                        >
                            CUSTOMER
                        </button>
                        <button
                            type="button"
                            className={`role-btn ${selectedRole === 'seller' ? 'active' : ''}`}
                            onClick={() => setSelectedRole('seller')}
                        >
                            SELLER
                            
                        </button>
                    </div>

                    {error && <div id="errorMessage" style={{ display: 'block' }}>{error}</div>}

                    {loadingState && (

                        <div className="loading-spinner">

                            <span>Loading...</span>

                        </div>

                    )}

                    <form className="login-form" onSubmit={handleSubmit}>

                        {isSignUp && (

                            <div className="form-group" id="nameField">

                                <label htmlFor="name">Full Name</label>

                                <input

                                    type="text"

                                    id="name"

                                    name="name"

                                    value={formData.name}

                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Your Name(e.g john , Ali )" required />
                            </div>)}

                        <div className="form-group">

                            <label htmlFor="email">Email Address</label>

                            <input

                                type="email"

                                id="email"

                                name="email"

                                value={formData.email}

                                onChange={handleChange}

                                className="form-input"

                                placeholder="you@example.com"

                                required

                            />

                        </div>

                        <div className="form-group">

                            <label htmlFor="password">Password</label>

                            <input

                                type="password"

                                id="password"

                                name="password"

                                value={formData.password}

                                onChange={handleChange}

                                className="form-input"

                                placeholder="••••••••"

                                required

                            />

                        </div>

                        <div className="form-options">

                            <label className="checkbox-label">

                                <input type="checkbox" /> Remember me

                            </label>

                            {!isSignUp && (

                                <a href="#" className="forgot-link" onClick={e => { e.preventDefault(); setShowForgot(true); }}>

                                    Forgot password?

                                </a>

                            )}

                        </div>

                        <button type="submit" className="btn-luxury-full" disabled={loadingState}>
                            {loadingState ? (isSignUp ? 'PREPARING...' : 'ACCESSING...') : isSignUp ? 'CREATE ACCOUNT' : 'ENTER ATELIER'}
                        </button>

                    </form>

                    {showForgot && (

                        <div className="forgot-section" style={{ marginTop: '1rem' }}>

                            <input

                                type="email"

                                placeholder="Enter email for reset"

                                value={forgotEmail}

                                onChange={e => setForgotEmail(e.target.value)}

                                className="form-input"

                            />

                            <button className="login-button" onClick={handleForgotPassword} disabled={loadingState}>

                                Send Reset Link

                            </button>

                            <button className="login-button" onClick={() => setShowForgot(false)} disabled={loadingState} style={{ marginTop: '0.5rem' }}>

                                Cancel

                            </button>

                        </div>

                    )}

                    <div className="divider"><span>OR</span></div>

                    <div className="social-login">

                        <button className="social-button google" onClick={handleGoogleSignIn} disabled={loadingState}>

                            {/* Simple Google SVG */}

                            <svg width="20" height="20" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg"><path d="M533.5 278.4c0-17.7-1.5-35-4.5-51.8H272v98.1h146.9c-6.4 34.5-25.5 63.7-54.5 83.2v68.9h88.1c51.5-47.5 81.5-117.5 81.5-198.4" fill="#4285F4" /><path d="M272 544.3c73.5 0 135.2-24.3 180.3-66.2l-88.1-68.9c-24.5 16.5-55.9 26.2-92.2 26.2-70.9 0-131-47.9-152.5-112.5h-90.9v70.9c45.1 89.5 138.7 150.5 243.4 150.5" fill="#34A853" /><path d="M119.5 322.9c-10.5-31.5-10.5-65.5 0-97v-70.9h-90.9c-38.9 77.2-38.9 168.6 0 245.8l90.9-70.9" fill="#FBBC05" /><path d="M272 107.7c39.9-.6 78.5 15.2 107.5 43.6l80.5-80.5C417.5 22.5 345.9-1.9 272 0 167.3 0 73.7 61 28.6 150.5l90.9 70.9C141 155.6 201.1 107.7 272 107.7" fill="#EA4335" /></svg>

                            Sign in with Google

                        </button>

                    </div>

                    <div className="signup-prompt">

                        {isSignUp ? (

                            <>

                                Already have an account?{' '}

                                <a href="#" className="signup-link" onClick={e => { e.preventDefault(); toggleMode(); }}>

                                    Sign In

                                </a>

                            </>

                        ) : (

                            <>

                                Don't have an account?{' '}

                                <a href="#" className="signup-link" onClick={e => { e.preventDefault(); toggleMode(); }}>

                                    Sign Up

                                </a>

                                <span className="role-badge">Sign in or sign up as a seller is Premium Access for Store Builder Users Only.</span>

                            </>


                        )}

                    </div>

                </div>

            </div>

        </div>

    );

};



export default Login;