/**
 * Login Page Component
 * Clean, modern login page with Google authentication
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Flame, Shield, AlertCircle } from 'lucide-react';
import AccessRequestForm from './AccessRequestForm';

export default function LoginPage() {
    const { signInWithGoogle } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showRequestForm, setShowRequestForm] = useState(false);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur de connexion');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-orange-500/10 to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo and title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-2xl mb-4">
                        <Flame className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">SOVALEM</h1>
                    <p className="text-slate-400">Simulateur de Combustion</p>
                </div>

                {/* Login card */}
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
                    {showRequestForm ? (
                        <AccessRequestForm onBack={() => setShowRequestForm(false)} />
                    ) : (
                        <>
                            <div className="flex items-center gap-2 mb-6">
                                <Shield className="w-5 h-5 text-emerald-400" />
                                <span className="text-sm text-slate-400">Accès sécurisé</span>
                            </div>

                            <h2 className="text-xl font-semibold text-white mb-6">Connexion</h2>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}

                            <button
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-slate-800 font-medium py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        Continuer avec Google
                                    </>
                                )}
                            </button>

                            <p className="mt-6 text-center text-sm text-slate-500">
                                Accès réservé aux utilisateurs autorisés
                            </p>

                            {/* Divider */}
                            <div className="flex items-center gap-3 mt-6">
                                <div className="flex-1 h-px bg-slate-700" />
                                <span className="text-xs text-slate-500">ou</span>
                                <div className="flex-1 h-px bg-slate-700" />
                            </div>

                            {/* Request invitation */}
                            <button
                                onClick={() => setShowRequestForm(true)}
                                className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-medium py-3 px-4 rounded-xl transition-all duration-200 border border-slate-600/50 hover:border-slate-500"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                                Demander une invitation
                            </button>
                        </>
                    )}
                </div>

                {/* Footer */}
                <p className="mt-8 text-center text-xs text-slate-600">
                    © 2024 SOVALEM • Outil interne
                </p>
            </div>
        </div>
    );
}
