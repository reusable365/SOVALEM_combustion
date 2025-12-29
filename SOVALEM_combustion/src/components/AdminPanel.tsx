/**
 * Admin Panel Component
 * Allows admins to manage access requests
 */

import { useState, useEffect } from 'react';
import {
    getAllRequests,
    approveRequest,
    rejectRequest,
    deleteRequest,
    type AccessRequest
} from '../services/accessRequestService';
import { addAllowedUser } from '../services/allowedUsersService';
import { useAuth } from '../contexts/AuthContext';
import {
    Shield,
    CheckCircle,
    XCircle,
    Trash2,
    Clock,
    UserCheck,
    UserX,
    RefreshCw,
    X,
    Mail
} from 'lucide-react';

interface AdminPanelProps {
    onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
    const { user } = useAuth();
    const [requests, setRequests] = useState<AccessRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = await getAllRequests();
            setRequests(data);
        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleApprove = async (request: AccessRequest) => {
        if (!request.id) return;
        setActionLoading(request.id);
        try {
            // Add user to allowed users collection (automatic access!)
            await addAllowedUser(request.email, request.name, user?.email || 'admin');

            // Mark request as approved
            await approveRequest(request.id);

            // Open email to notify user
            const subject = encodeURIComponent('✅ Accès SOVALEM Simulator approuvé');
            const body = encodeURIComponent(
                `Bonjour ${request.name},\n\n` +
                `Votre demande d'accès au simulateur SOVALEM a été approuvée !\n\n` +
                `Vous pouvez maintenant vous connecter avec votre compte Google (${request.email}) sur :\n` +
                `https://sovalem-cadario-beta.web.app\n\n` +
                `Cordialement,\n` +
                `L'équipe SOVALEM`
            );
            window.open(`mailto:${request.email}?subject=${subject}&body=${body}`, '_blank');

            await loadRequests();
        } catch (error) {
            console.error('Error approving request:', error);
            alert('Erreur lors de l\'approbation. Veuillez réessayer.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (requestId: string, email: string, name: string) => {
        setActionLoading(requestId);
        try {
            await rejectRequest(requestId, rejectReason);

            // Open email to notify user
            const subject = encodeURIComponent('Demande d\'accès SOVALEM Simulator');
            const body = encodeURIComponent(
                `Bonjour ${name},\n\n` +
                `Votre demande d'accès au simulateur SOVALEM n'a pas pu être approuvée.\n\n` +
                `Motif : ${rejectReason || 'Non spécifié'}\n\n` +
                `Si vous pensez qu'il s'agit d'une erreur, vous pouvez soumettre une nouvelle demande.\n\n` +
                `Cordialement,\n` +
                `L'équipe SOVALEM`
            );
            window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');

            setRejectingId(null);
            setRejectReason('');
            await loadRequests();
        } catch (error) {
            console.error('Error rejecting request:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (requestId: string) => {
        if (!confirm('Supprimer cette demande ?')) return;
        setActionLoading(requestId);
        try {
            await deleteRequest(requestId);
            await loadRequests();
        } catch (error) {
            console.error('Error deleting request:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredRequests = requests.filter(r =>
        filter === 'all' ? true : r.status === filter
    );

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <Shield className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Gestion des accès</h2>
                            <p className="text-sm text-slate-400">
                                {pendingCount} demande{pendingCount !== 1 ? 's' : ''} en attente
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={loadRequests}
                            disabled={loading}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                            title="Actualiser"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 p-4 border-b border-slate-700">
                    {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            {f === 'pending' && '⏳ En attente'}
                            {f === 'approved' && '✅ Approuvées'}
                            {f === 'rejected' && '❌ Refusées'}
                            {f === 'all' && '📋 Toutes'}
                            {f === 'pending' && pendingCount > 0 && (
                                <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Aucune demande {filter !== 'all' ? `${filter === 'pending' ? 'en attente' : filter === 'approved' ? 'approuvée' : 'refusée'}` : ''}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredRequests.map((request) => (
                                <div
                                    key={request.id}
                                    className={`p-4 rounded-xl border ${request.status === 'pending'
                                        ? 'bg-slate-700/50 border-slate-600'
                                        : request.status === 'approved'
                                            ? 'bg-emerald-900/20 border-emerald-700/50'
                                            : 'bg-red-900/20 border-red-700/50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {request.status === 'pending' && <Clock className="w-4 h-4 text-amber-400" />}
                                                {request.status === 'approved' && <UserCheck className="w-4 h-4 text-emerald-400" />}
                                                {request.status === 'rejected' && <UserX className="w-4 h-4 text-red-400" />}
                                                <span className="font-medium text-white">{request.name}</span>
                                            </div>
                                            <p className="text-sm text-slate-400 truncate">{request.email}</p>
                                            <p className="text-sm text-slate-500">{request.service}</p>
                                            {request.message && (
                                                <p className="text-sm text-slate-400 mt-2 italic">"{request.message}"</p>
                                            )}
                                            {request.rejectionReason && (
                                                <p className="text-sm text-red-400 mt-2">
                                                    Motif : {request.rejectionReason}
                                                </p>
                                            )}
                                            <p className="text-xs text-slate-500 mt-2">
                                                {request.createdAt?.toDate?.()?.toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) || 'Date inconnue'}
                                            </p>
                                        </div>

                                        {request.status === 'pending' && request.id && (
                                            <div className="flex flex-col gap-2">
                                                {rejectingId === request.id ? (
                                                    <div className="flex flex-col gap-2">
                                                        <input
                                                            type="text"
                                                            value={rejectReason}
                                                            onChange={(e) => setRejectReason(e.target.value)}
                                                            placeholder="Motif du refus..."
                                                            className="px-3 py-1.5 bg-slate-600 border border-slate-500 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                                                            autoFocus
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleReject(request.id!, request.email, request.name)}
                                                                disabled={actionLoading === request.id}
                                                                className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                                                            >
                                                                Confirmer
                                                            </button>
                                                            <button
                                                                onClick={() => setRejectingId(null)}
                                                                className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded-lg transition-colors"
                                                            >
                                                                Annuler
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(request)}
                                                            disabled={actionLoading === request.id}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                                                            title="Approuver et notifier"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            Approuver
                                                        </button>
                                                        <button
                                                            onClick={() => setRejectingId(request.id!)}
                                                            disabled={actionLoading === request.id}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                                                            title="Refuser avec motif"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                            Refuser
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {request.status !== 'pending' && request.id && (
                                            <div className="flex gap-2">
                                                <a
                                                    href={`mailto:${request.email}`}
                                                    className="p-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                                                    title="Envoyer un email"
                                                >
                                                    <Mail className="w-4 h-4" />
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(request.id!)}
                                                    disabled={actionLoading === request.id}
                                                    className="p-2 bg-slate-600 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-700 bg-slate-800/50">
                    <p className="text-xs text-emerald-400 text-center">
                        ✨ L'approbation est automatique ! L'utilisateur pourra se connecter immédiatement après votre validation.
                    </p>
                </div>
            </div>
        </div>
    );
}
