import React, { useMemo } from 'react';
import { Brain, AlertOctagon, CheckCircle, Flame, CloudRain, Sun, Activity, Info } from 'lucide-react';
import { useBoilerData } from '../hooks/useBoilerData';
import { calculateEstimatedPCI } from '../utils/combustionLogic';
import { CalculationTooltip, type CalculationDetails } from './CalculationTooltip';

interface Props {
    data: ReturnType<typeof useBoilerData>;
    onHelp: (topic: string) => void;
}

export const AIAnalyst: React.FC<Props> = React.memo(({ data }) => {
    const { filteredHistory, simulation, steamTarget } = data;

    // A. PCI Estimation (Virtual Sensor)
    // A. PCI Estimation (Virtual Sensor)
    // We use simulated steam flow (which reflects PCI boost) instead of target
    const estimatedPCI = useMemo(() => calculateEstimatedPCI(
        simulation.steamFlow,
        simulation.totalAir,
        simulation.simulatedO2
    ), [simulation.steamFlow, simulation.totalAir, simulation.simulatedO2]);

    // Build calculation trace for tooltip
    const pciCalculationDetails: CalculationDetails = useMemo(() => {
        const o2Consumed = 21 - simulation.simulatedO2;
        const performanceRatio = (steamTarget * 1000) / (simulation.totalAir * o2Consumed);
        const baseRatio = 0.068;

        let interpretation = 'Combustion normale avec PCI standard.';
        if (estimatedPCI < 8000) {
            interpretation = 'Déchets humides ou organiques → combustion lente, moins de chaleur produite.';
        } else if (estimatedPCI > 10500) {
            interpretation = 'Déchets secs/plastiques → combustion rapide, risque de surchauffe SH5.';
        }

        return {
            title: 'Estimation PCI Virtuel',
            formula: 'PCI = 9200 × (Performance / Référence)',
            steps: [
                { label: 'Vapeur Produite', value: steamTarget, unit: 'T/h' },
                { label: 'Air Total', value: simulation.totalAir, unit: 'Nm³/h' },
                { label: 'O₂ Consommé', value: o2Consumed.toFixed(1), unit: '%' },
                { label: 'Ratio Performance', value: performanceRatio.toFixed(4) },
                { label: 'Ratio Référence', value: baseRatio },
                { label: 'PCI Calculé', value: estimatedPCI, unit: 'kJ/kg' }
            ],
            interpretation
        };
    }, [steamTarget, simulation.totalAir, simulation.simulatedO2, estimatedPCI]);

    let pciStatus = { label: 'Normal (Standard)', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: Sun };

    // Safety override: If O2 is too low, estimation is invalid (unburnt fuel)
    if (simulation.simulatedO2 < 2.0) {
        pciStatus = { label: 'Asphyxie / Manque d\'Air', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', icon: CloudRain };
    } else {
        // Adjusted thresholds for new physics engine (7000-10000 range for standard)
        if (estimatedPCI < 7000) {
            pciStatus = { label: 'Arrivage Humide / Pauvre', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: CloudRain };
        } else if (estimatedPCI > 10000) {
            pciStatus = { label: 'Arrivage Explosif / Riche', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: Flame };
        }
    }

    // B. AI REASONING ENGINE (EXPLAINABILITY)
    const generateAdvice = () => {
        const advices = [];

        // 1. Check Temperature Safety
        if (simulation.sh5Temp > 620) {
            const reason = simulation.sh5Temp > 640 ? "CRITIQUE" : "ALERTE";
            let action = "Augmenter Air Secondaire (Mode 2)";
            let explanation = "La T° SH5 dépasse le seuil de sécurité.";

            // If Air is already maxed or high O2 -> Maybe it's fouling?
            if (simulation.asFlow > 10000 || simulation.simulatedO2 > 8) {
                if (data.foulingFactor > 10) {
                    action = "Lancer Ramonage + Baisser Charge";
                    explanation = `L'air est déjà fort (O2=${simulation.simulatedO2}%), mais l'encrassement (${data.foulingFactor.toFixed(0)}%) empêche l'échange thermique.`;
                } else {
                    action = "Baisser Poussoir (Charge)";
                    explanation = "Surcharge thermique malgré un air suffisant. Le PCI doit être plus haut que prévu.";
                }
            } else {
                explanation += " Le bilan air est insuffisant pour refroidir les fumées.";
            }

            advices.push({ type: 'danger', title: `Surchauffe SH5 (${reason})`, action, explanation });
        }

        // 2. Check PCI Drift
        if (estimatedPCI > 11000 && simulation.sh5Temp > 600) {
            advices.push({
                type: 'warning',
                title: "PCI Explosif Détecté",
                action: "Réduire vitesse Poussoir de 10%",
                explanation: `Le "Rendement Vapeur" est anormalement haut (PCI Est. ${estimatedPCI} kJ/kg). Le déchet est sec/plastique.`
            });
        }

        // 3. Efficiency / Fouling
        if (data.foulingFactor > 30) {
            advices.push({
                type: 'info',
                title: "Perte d'Efficacité",
                action: "Planifier Ramonage",
                explanation: `L'encrassement atteint ${data.foulingFactor.toFixed(1)}%, ce qui force à sur-ventiler pour maintenir la T°.`
            });
        }

        return advices;
    };

    const activeAdvices = generateAdvice();


    // C. Historical Recommendation (Best Point)
    const goodPoints = useMemo(() =>
        filteredHistory.filter(d => d.sh5Temp < 620 && d.sh5Temp > 500 && d.steamFlow > (steamTarget * 0.9)),
        [filteredHistory, steamTarget]);

    const bestPoint = useMemo(() =>
        goodPoints.sort((a, b) => a.sh5Temp - b.sh5Temp)[0],
        [goodPoints]);

    return (
        <div className="space-y-4">
            {/* 1. PCI STATUS CARD */}
            <div
                className={`p-4 rounded-xl border ${pciStatus.bg} ${pciStatus.border} transition-all relative overflow-hidden hover:shadow-md`}
            >
                <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-bold ${pciStatus.color} flex items-center gap-2 text-sm`}>
                        <pciStatus.icon size={18} /> Qualité Arrivages (Est.)
                        <CalculationTooltip details={pciCalculationDetails} position="right" />
                    </h4>
                    <span className="text-slate-500 font-mono text-[10px]">PCI Ref: 9200 kJ/kg</span>
                </div>

                <div className="flex items-baseline justify-between mb-3 z-10 relative">
                    <span className={`text-2xl font-black ${pciStatus.color}`}>{estimatedPCI} <span className="text-xs font-normal opacity-70">kJ/kg</span></span>
                    <span className={`text-xs font-bold px-2 py-1 rounded bg-white/60 backdrop-blur-sm shadow-sm ${pciStatus.color}`}>{pciStatus.label}</span>
                </div>

                {/* Gauge Visualization */}
                <div className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden relative">
                    <div className="absolute top-0 h-full bg-gradient-to-r from-blue-400 via-green-400 to-orange-400 opacity-50 w-full" />
                    <div
                        className={`absolute top-0 bottom-0 w-3 h-full rounded-full border border-white shadow-md transition-all duration-1000 ${estimatedPCI > 10500 ? 'bg-orange-500' : estimatedPCI < 8000 ? 'bg-blue-500' : 'bg-green-500'}`}
                        style={{ left: `${Math.min(98, Math.max(0, ((estimatedPCI - 6000) / 7000) * 100))}%` }}
                    />
                </div>
            </div>

            {/* 2. AI REASONING FEED (DYNAMIC) */}
            {activeAdvices.length > 0 ? (
                <div className="space-y-3">
                    {activeAdvices.map((advice, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border shadow-sm ${advice.type === 'danger' ? 'bg-red-50 border-red-200' : advice.type === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${advice.type === 'danger' ? 'bg-red-100 text-red-600' : advice.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {advice.type === 'danger' ? <AlertOctagon size={20} /> : <Activity size={20} />}
                                </div>
                                <div className="flex-1">
                                    <h4 className={`font-bold text-sm mb-1 ${advice.type === 'danger' ? 'text-red-900' : advice.type === 'warning' ? 'text-amber-900' : 'text-blue-900'}`}>
                                        {advice.title}
                                    </h4>
                                    <div className="text-xs font-semibold mb-2 bg-white/60 p-1.5 rounded inline-block">
                                        👉 {advice.action}
                                    </div>
                                    <p className="text-[11px] leading-tight opacity-90 italic flex items-start gap-1">
                                        <Info size={12} className="mt-0.5 shrink-0" />
                                        "{advice.explanation}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-4 rounded-xl border border-green-100 bg-green-50/50 flex items-center gap-3">
                    <CheckCircle className="text-green-500" size={24} />
                    <div>
                        <h4 className="font-bold text-green-900 text-sm">Système Stable</h4>
                        <p className="text-xs text-green-700">Aucune anomalie majeure.</p>
                    </div>
                </div>
            )}


            {/* 3. OPTIMIZATION MEMORY */}
            {bestPoint && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3 text-xs uppercase tracking-widest">
                        <Brain size={14} className="text-indigo-500" /> Mémoire Optimale
                    </h4>
                    <div className="flex justify-between items-center text-xs mb-3">
                        <span className="text-slate-500">Meilleur Point Historique</span>
                        <span className="font-mono font-bold text-emerald-600">{bestPoint.sh5Temp}°C</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        {[1, 2, 3].map(z => {
                            const val = bestPoint[`zone${z}Flow` as keyof typeof bestPoint] as number;
                            const total = bestPoint.zone1Flow + bestPoint.zone2Flow + bestPoint.zone3Flow;
                            const pct = Math.round((val / total) * 100);
                            return (
                                <div key={z} className="bg-white dark:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-600 text-center">
                                    <span className="text-[10px] text-slate-400 block mb-1">Zone {z}</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{pct}%</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
});
