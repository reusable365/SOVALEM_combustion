/**
 * Authentication Context
 * Provides authentication state throughout the application
 * Uses Firestore for dynamic allowed users list
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
    type User,
    onAuthStateChanged,
    signInWithPopup,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { isEmailAllowed } from '../services/allowedUsersService';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Check if user is allowed (async check to Firestore)
                const allowed = await isEmailAllowed(firebaseUser.email || '');
                if (allowed) {
                    setUser(firebaseUser);
                } else {
                    // User is signed in but not authorized
                    console.warn('User not in allowed list:', firebaseUser.email);
                    await firebaseSignOut(auth);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const allowed = await isEmailAllowed(result.user.email || '');
            if (!allowed) {
                await firebaseSignOut(auth);
                throw new Error('Accès non autorisé. Demandez une invitation à l\'administrateur.');
            }
        } catch (error) {
            console.error('Google sign-in error:', error);
            throw error;
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const allowed = await isEmailAllowed(result.user.email || '');
            if (!allowed) {
                await firebaseSignOut(auth);
                throw new Error('Accès non autorisé. Demandez une invitation à l\'administrateur.');
            }
        } catch (error) {
            console.error('Email sign-in error:', error);
            throw error;
        }
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
