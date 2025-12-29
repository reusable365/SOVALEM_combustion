import React, { useMemo } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { useBoilerData } from '../hooks/useBoilerData';
import { CalculationTooltip, type CalculationDetails } from './CalculationTooltip';

interface Props {
    data: ReturnType<typeof useBoilerData>;
}

// Statistical functions
const calculateMean = (values: number[]): number => {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
};

const calculateStdDev = (values: number[]): number => {
    if (values.length < 2) return 0;
    const mean = calculateMean(values);
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
};

const calculateZScore = (value: number, mean: number, stdDev: number): number => {
    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
};

export const StatisticalAnalyzer: React.FC<Props> = ({ data }) => {
    const { filteredHistory } = data;

    if (filteredHistory.length < 10) {
        return (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-400 text-sm">
                <Activity className="mx-auto mb-2 opacity-50" />
                Pas assez de données pour l'analyse statistique (minimum 10 points).
            </div>
        );
    }

    // Get recent window (last 30 points)
    const recentWindow = filteredHistory.slice(-30);
    const temps = recentWindow.map(d => d.sh5Temp);
    const barycenters = recentWindow.map(d => d.barycenter);

    // Calculate statistics for SH5 Temperature
    const tempMean = calculateMean(temps);
    const tempStdDev = calculateStdDev(temps);
    const latestTemp = temps[temps.length - 1];
    const tempZScore = calculateZScore(latestTemp, tempMean, tempStdDev);

    // Calculate statistics for Barycenter
    const baryMean = calculateMean(barycenters);
    const baryStdDev = calculateStdDev(barycenters);
    const latestBary = barycenters[barycenters.length - 1];
    const baryZScore = calculateZScore(latestBary, baryMean, baryStdDev);

    // Detect anomalies (|z-score| > 2.5 = 98.8% confidence)
    const tempAnomaly = Math.abs(tempZScore) > 2.5;
    const baryAnomaly = Math.abs(baryZScore) > 2.5;

    // Tooltip for SH5 Temperature
    const tempCalculationDetails: CalculationDetails = useMemo(() => ({
        title: 'Statistiques Température SH5',
        formula: 'Z-score = (Valeur - Moyenne) / Écart-type',
        steps: [
            { label: 'Valeur actuelle', value: latestTemp, unit: '°C' },
            { label: 'Moyenne (30 pts)', value: tempMean.toFixed(1), unit: '°C' },
            { label: 'Écart-type', value: tempStdDev.toFixed(2), unit: '°C' },
            { label: 'Z-score', value: tempZScore.toFixed(2) },
        ],
        interpretation: tempAnomaly
            ? `Anomalie détectée : la température s'écarte de plus de 2.5σ de la moyenne.`
            : `Comportement normal : la température reste dans la plage [±${(2 * tempStdDev).toFixed(1)}°C] de la moyenne.`
    }), [latestTemp, tempMean, tempStdDev, tempZScore, tempAnomaly]);

    // Tooltip for Barycenter
    const baryCalculationDetails: CalculationDetails = useMemo(() => ({
        title: 'Calcul Barycentre Feu',
        formula: 'B = Σ(Flux_rouleau × Position) / Σ(Flux_rouleau)',
        steps: [
            { label: 'Position actuelle', value: latestBary.toFixed(2) },
            { label: 'Moyenne (30 pts)', value: baryMean.toFixed(2) },
            { label: 'Écart-type', value: baryStdDev.toFixed(3) },
            { label: 'Z-score', value: baryZScore.toFixed(2) },
        ],
        interpretation: latestBary < 2.5
            ? 'Feu avant (Zone 1) : bon séchage, risque de refroidissement si trop avancé.'
            : latestBary > 3.5
                ? 'Feu arrière (Zone 3) : risque de surchauffe SH5, réduire air Zone 3.'
                : 'Feu centré (optimal) : combustion équilibrée entre les zones.'
    }), [latestBary, baryMean, baryStdDev, baryZScore]);

    // Calculate trend (simple linear regression slope)
    const calculateTrend = (values: number[]): 'stable' | 'increasing' | 'decreasing' => {
        if (values.length < 5) return 'stable';
        const n = values.length;
        const xMean = (n - 1) / 2;
        const yMean = calculateMean(values);

        let numerator = 0;
        let denominator = 0;

        values.forEach((y, x) => {
            numerator += (x - xMean) * (y - yMean);
            denominator += Math.pow(x - xMean, 2);
        });

        const slope = numerator / denominator;

        if (Math.abs(slope) < 0.1) return 'stable';
        return slope > 0 ? 'increasing' : 'decreasing';
    };

    const tempTrend = calculateTrend(temps);
    const baryTrend = calculateTrend(barycenters);

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-3 text-sm flex items-center gap-2">
                <TrendingUp size={16} className="text-indigo-600" />
                Analyse Statistique (30 derniers points)
            </h3>

            <div className="space-y-3">
                {/* Temperature SH5 Analysis */}
                <div className={`p-3 rounded-lg border ${tempAnomaly ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                                Température SH5
                                <CalculationTooltip details={tempCalculationDetails} position="right" size={12} />
                            </div>
                            <div className="text-lg font-bold text-slate-800">{latestTemp?.toFixed(1)}°C</div>
                        </div>
                        {tempAnomaly && (
                            <AlertTriangle size={20} className="text-orange-600" />
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div>
                            <span className="text-slate-400 block">Moyenne</span>
                            <span className="font-mono font-bold">{tempMean.toFixed(1)}°C</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block">Écart-type</span>
                            <span className="font-mono font-bold">{tempStdDev.toFixed(1)}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block">Tendance</span>
                            <span className={`font-bold ${tempTrend === 'increasing' ? 'text-red-600' :
                                tempTrend === 'decreasing' ? 'text-green-600' : 'text-slate-600'
                                }`}>
                                {tempTrend === 'increasing' ? '↑ Hausse' :
                                    tempTrend === 'decreasing' ? '↓ Baisse' : '→ Stable'}
                            </span>
                        </div>
                    </div>

                    {tempAnomaly && (
                        <div className="mt-2 text-[10px] bg-orange-100 p-2 rounded text-orange-800 font-semibold">
                            ⚠️ Anomalie détectée (Z-score: {tempZScore.toFixed(2)})
                        </div>
                    )}
                </div>

                {/* Barycenter Analysis */}
                <div className={`p-3 rounded-lg border ${baryAnomaly ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                                Barycentre Feu
                                <CalculationTooltip details={baryCalculationDetails} position="right" size={12} />
                            </div>
                            <div className="text-lg font-bold text-slate-800">{latestBary?.toFixed(2)}</div>
                        </div>
                        {baryAnomaly && (
                            <AlertTriangle size={20} className="text-blue-600" />
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div>
                            <span className="text-slate-400 block">Moyenne</span>
                            <span className="font-mono font-bold">{baryMean.toFixed(2)}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block">Écart-type</span>
                            <span className="font-mono font-bold">{baryStdDev.toFixed(2)}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block">Tendance</span>
                            <span className={`font-bold ${baryTrend === 'increasing' ? 'text-red-600' :
                                baryTrend === 'decreasing' ? 'text-blue-600' : 'text-slate-600'
                                }`}>
                                {baryTrend === 'increasing' ? '↑ Arrière' :
                                    baryTrend === 'decreasing' ? '↓ Avant' : '→ Stable'}
                            </span>
                        </div>
                    </div>

                    {baryAnomaly && (
                        <div className="mt-2 text-[10px] bg-blue-100 p-2 rounded text-blue-800 font-semibold">
                            ⚠️ Changement brusque détecté (Z-score: {baryZScore.toFixed(2)})
                        </div>
                    )}
                </div>

                {/* Overall Health */}
                {!tempAnomaly && !baryAnomaly && (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded text-xs">
                        <CheckCircle size={14} />
                        <span className="font-semibold">Comportement normal - Stabilité confirmée</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// Memoize component to prevent re-renders when data hasn't changed
export default React.memo(StatisticalAnalyzer);
