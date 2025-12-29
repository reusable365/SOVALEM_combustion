/**
 * Access Request Form Component
 * Allows users to request access to the application
 */

import { useState } from 'react';
import { submitAccessRequest, hasPendingRequest } from '../services/accessRequestService';
import { Send, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

interface AccessRequestFormProps {
    onBack: () => void;
}

export default function AccessRequestForm({ onBack }: AccessRequestFormProps) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [service, setService] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Check if already has pending request
            const hasPending = await hasPendingRequest(email);
            if (hasPending) {
                setError('Une demande est déjà en cours pour cet email. Veuillez patienter.');
                setLoading(false);
                return;
            }

            await submitAccessRequest(email, name, service, message);
            setSuccess(true);
        } catch (err) {
            console.error('Error submitting request:', err);
            setError('Erreur lors de l\'envoi. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-full mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Demande envoyée !</h3>
                <p className="text-slate-400 mb-6">
                    Votre demande a été transmise à l'administrateur.<br />
                    Vous recevrez une réponse par email.
                </p>
                <button
                    onClick={onBack}
                    className="text-indigo-400 hover:text-indigo-300 font-medium"
                >
                    Retour à la connexion
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
            >
                <ArrowLeft className="w-4 h-4" />
                Retour
            </button>

            <h2 className="text-xl font-semibold text-white mb-4">Demander un accès</h2>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                    Email Google *
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="votre.email@gmail.com"
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                    Nom complet *
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Jean Dupont"
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                    Service / Entreprise *
                </label>
                <input
                    type="text"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    required
                    placeholder="Exploitation - SOVALEM"
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                    Message (optionnel)
                </label>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Pourquoi souhaitez-vous accéder au simulateur ?"
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                    <>
                        <Send className="w-4 h-4" />
                        Envoyer la demande
                    </>
                )}
            </button>
        </form>
    );
}
