import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, AlertOctagon, Siren } from 'lucide-react';
import type { AnomalyState } from '../types';

interface Props {
    anomalyState: AnomalyState;
    sh5Temp: number;
    o2: number;
    barycenter: number;
    onHelp: (topic: string) => void;
}

/**
 * BANDEAU D'ALERTE AMÉLIORÉ
 * Intègre le système de détection d'anomalies avec la signature explosion
 */
export const AlertBanner: React.FC<Props> = React.memo(({
    anomalyState,
    sh5Temp,
    o2: _o2,
    barycenter: _barycenter,
    onHelp
}) => {
    const { riskLevel, activeAnomalies, explosionRiskScore } = anomalyState;

    // ========================================
    // ALERTE CRITIQUE - RISQUE EXPLOSION
    // ========================================
    if (riskLevel === 'EMERGENCY' || riskLevel === 'CRITICAL') {
        const explosionAnomaly = activeAnomalies.find(a => a.type === 'EXPLOSION_RISK');

        return (
            <div className="animate-pulse">
                <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white px-4 py-3 rounded-xl mb-4 shadow-lg border-2 border-red-400">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-800 rounded-full animate-bounce">
                            <Siren size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="font-black text-lg uppercase tracking-wide flex items-center gap-2">
                                🚨 ALERTE : Instabilité combustion détectée
                                <span className="text-sm font-normal bg-red-800 px-2 py-0.5 rounded">
                                    Score Risque: {explosionRiskScore}%
                                </span>
                            </div>
                            <div className="text-sm font-semibold text-red-200">
                                Risque Explosion / Surchauffe SH5
                            </div>
                        </div>
                    </div>

                    {/* Messages d'anomalies actives */}
                    <div className="bg-red-800/50 rounded-lg p-2 mb-2 space-y-1">
                        {activeAnomalies.map((anomaly, idx) => (
                            <div key={idx} className="text-xs flex items-start gap-2">
                                <AlertOctagon size={12} className="mt-0.5 flex-shrink-0" />
                                <span>{anomaly.message}</span>
                            </div>
                        ))}
                    </div>

                    {/* Action suggérée */}
                    <div className="bg-white/20 rounded-lg px-3 py-2 flex items-center gap-2">
                        <span className="text-2xl">👉</span>
                        <div>
                            <div className="font-bold text-sm">ACTION SUGGÉRÉE :</div>
                            <div className="text-xs">
                                {explosionAnomaly?.action || 'Augmenter Air Secondaire et ralentir la vitesse de grille'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================
    // ALERTE WARNING
    // ========================================
    if (riskLevel === 'WARNING') {
        const mainAnomaly = activeAnomalies[0];

        return (
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 rounded-xl mb-4 shadow-md">
                <div className="flex items-center gap-3">
                    <AlertTriangle size={24} />
                    <div className="flex-1">
                        <div className="font-bold text-sm">
                            ⚠️ ATTENTION : {mainAnomaly?.message || 'Anomalie détectée'}
                        </div>
                        <div className="text-xs opacity-90">
                            → {mainAnomaly?.action || 'Surveiller les paramètres'}
                        </div>
                    </div>
                    <span className="text-[10px] opacity-75 uppercase">
                        Score: {explosionRiskScore}%
                    </span>
                </div>
            </div>
        );
    }

    // ========================================
    // ALERTES SIMPLES (Legacy - basées sur valeurs directes)
    // ========================================

    // Surchauffe SH5
    if (sh5Temp > 640) {
        return (
            <div
                className="bg-red-600 text-white px-4 py-2 rounded-xl mb-4 flex items-center justify-between cursor-help"
                onClick={() => onHelp('alerts')}
            >
                <div className="flex items-center gap-3">
                    <XCircle size={20} />
                    <div>
                        <span className="font-bold text-sm">🚨 CRITIQUE: SH5 &gt; 640°C - Réduire l'air primaire!</span>
                        <span className="text-xs opacity-90 ml-2">→ Baisser AP ou augmenter AS</span>
                    </div>
                </div>
            </div>
        );
    }

    if (sh5Temp > 620) {
        return (
            <div
                className="bg-orange-500 text-white px-4 py-2 rounded-xl mb-4 flex items-center justify-between cursor-help"
                onClick={() => onHelp('alerts')}
            >
                <div className="flex items-center gap-3">
                    <AlertTriangle size={20} />
                    <div>
                        <span className="font-bold text-sm">⚠️ ATTENTION: SH5 &gt; 620°C</span>
                        <span className="text-xs opacity-90 ml-2">→ Surveiller le barycentre</span>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================
    // FONCTIONNEMENT NORMAL
    // ========================================
    return (
        <div
            className="bg-emerald-500 text-white px-4 py-2 rounded-xl mb-4 flex items-center justify-between cursor-help transition-all hover:opacity-90"
            onClick={() => onHelp('alerts')}
        >
            <div className="flex items-center gap-3">
                <CheckCircle size={20} />
                <div>
                    <span className="font-bold text-sm">✓ Fonctionnement normal</span>
                    <span className="text-xs opacity-90 ml-2">Tous les paramètres dans les cibles</span>
                </div>
            </div>
            <span className="text-[10px] opacity-75 uppercase tracking-wider">Cliquer pour aide</span>
        </div>
    );
});
