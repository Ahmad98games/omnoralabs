import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';
import {
    auth,
    db,
    googleProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    sendPasswordResetEmail,
    onAuthStateChanged,
    signOut,
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from '../config/firebase';
import type { User as FirebaseAuthUser } from 'firebase/auth';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'customer' | 'admin';
    photoURL?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    isAuthenticated: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Listen to Firebase auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseAuthUser | null) => {
            if (firebaseUser) {
                try {
                    // Get user data from Firestore
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUser({
                            id: firebaseUser.uid,
                            email: firebaseUser.email || '',
                            name: userData.name || firebaseUser.displayName || '',
                            role: userData.role || 'customer',
                            photoURL: firebaseUser.photoURL || userData.photoURL
                        });
                    } else {
                        // Create user document if it doesn't exist
                        const newUser = {
                            id: firebaseUser.uid,
                            email: firebaseUser.email || '',
                            name: firebaseUser.displayName || 'User',
                            role: 'customer' as const,
                            photoURL: firebaseUser.photoURL || undefined
                        };
                        // Try to save to Firestore, but don't block if it fails
                        try {
                            await setDoc(doc(db, 'users', firebaseUser.uid), {
                                name: newUser.name,
                                email: newUser.email,
                                role: newUser.role,
                                photoURL: newUser.photoURL,
                                createdAt: serverTimestamp()
                            });
                        } catch (e) {
                            console.warn('Failed to create user profile in Firestore (offline?)', e);
                        }
                        setUser(newUser);
                    }
                } catch (error: any) {
                    console.error('Error fetching user profile:', error);
                    // Fallback: use basic auth info if Firestore fails (e.g. offline)
                    setUser({
                        id: firebaseUser.uid,
                        email: firebaseUser.email || '',
                        name: firebaseUser.displayName || 'User',
                        role: 'customer',
                        photoURL: firebaseUser.photoURL || undefined
                    });
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Login with email and password (Firebase)
    const login = async (email: string, password: string) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // User state will be updated by onAuthStateChanged listener
    };

    // Login with Google popup
    const loginWithGoogle = async () => {
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;

        // Check if user document exists, if not create it
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', firebaseUser.uid), {
                name: firebaseUser.displayName || 'User',
                email: firebaseUser.email,
                role: 'customer',
                photoURL: firebaseUser.photoURL,
                createdAt: serverTimestamp()
            });
        }
        // User state will be updated by onAuthStateChanged listener
    };

    // Register with email and password (Firebase)
    const register = async (name: string, email: string, password: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Create user document in Firestore
        await setDoc(doc(db, 'users', firebaseUser.uid), {
            name: name,
            email: email,
            role: 'customer',
            createdAt: serverTimestamp()
        });
        // User state will be updated by onAuthStateChanged listener
    };

    // Logout (Firebase)
    const logout = async () => {
        await signOut(auth);
        // User state will be updated by onAuthStateChanged listener
    };

    // Reset password
    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    const value = {
        user,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        resetPassword,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin'
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
