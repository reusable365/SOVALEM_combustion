import React from 'react';
import { Droplets, ThermometerSun, Info, AlertTriangle } from 'lucide-react';
import { useBoilerData } from '../hooks/useBoilerData';
import { CircularGauge } from './CircularGauge';
import { FormulaTooltip } from './FormulaTooltip';
import { TOOLTIP_FORMULAS } from '../data/helpContent';
import { getFireStatus, calculateEstimatedPCI, calculateTotalZonalFlow, BARYCENTER_THRESHOLDS } from '../utils/combustionLogic';

interface Props {
    data: ReturnType<typeof useBoilerData>;
    sh5Temp: number;
    steamFlow: number;
    o2: number;
    onHelp: (topic: string) => void;
}

export const ProcessIndicators: React.FC<Props> = React.memo(({ data, sh5Temp, steamFlow, o2, onHelp }) => {
    // Determine Fire Status Color
    const { currentBarycenter, simulation, foulingFactor } = data;

    // Use calibrated fire status from combustionLogic
    const fireStatus = getFireStatus(currentBarycenter);

    // Determine color based on calibrated fire status (3.0-4.2 optimal zone)
    const getBarycenterColor = () => {
        if (currentBarycenter === 0) return '#94a3b8'; // slate-400
        if (currentBarycenter < BARYCENTER_THRESHOLDS.FORWARD_RISK) return '#2563eb'; // blue-600
        if (currentBarycenter > BARYCENTER_THRESHOLDS.BACKWARD_RISK) return '#dc2626'; // red-600
        return '#16a34a'; // green-600
    };

    // Calculate dynamic PCI from current simulation values
    const totalZonalFlow = calculateTotalZonalFlow(
        (data.zones.zone1 / 100) * data.totalPrimaryAirFlow,
        (data.zones.zone2 / 100) * data.totalPrimaryAirFlow,
        (data.zones.zone3 / 100) * data.totalPrimaryAirFlow
    );
    const dynamicPCI = calculateEstimatedPCI(steamFlow, totalZonalFlow, o2);

    // Economic Calculation
    const steamValue = steamFlow * 45; // €/h (Valorisation)
    const airCost = simulation.totalAir * 0.005; // €/h (Conso ventilateurs)
    const foulingCost = foulingFactor * 5; // €/h (Perte rendement / Maintenance future)

    const margin = steamValue - airCost - foulingCost;
    const efficiencyScore = Math.min(100, Math.max(0, (margin / (steamValue || 1)) * 100));

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {/* BARYCENTRE */}
            <FormulaTooltip
                formula={TOOLTIP_FORMULAS['barycenter'].formula}
                hint={TOOLTIP_FORMULAS['barycenter'].hint}
            >
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center cursor-help relative group">
                    <CircularGauge
                        value={currentBarycenter}
                        min={0}
                        max={6}
                        label="Barycentre Feu"
                        color={getBarycenterColor()}
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Info className="w-4 h-4 text-slate-400" />
                    </div>
                </div>
            </FormulaTooltip>

            {/* SH5 TEMPERATURE */}
            <FormulaTooltip
                formula={TOOLTIP_FORMULAS['sh5-temp'].formula}
                hint={TOOLTIP_FORMULAS['sh5-temp'].hint}
            >
                <div
                    className={`p-4 rounded-xl shadow-sm border cursor-help transition-all hover:border-slate-400 relative group ${sh5Temp > 630 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}
                    onClick={() => onHelp('sh5_temp')}
                >
                    <div className="flex items-center gap-2 text-slate-500 mb-1 text-sm font-semibold">
                        <ThermometerSun size={16} className={sh5Temp > 630 ? 'text-red-500' : ''} /> T° SH5 (Cible &lt; 620)
                    </div>
                    <div className={`text-2xl font-bold ${sh5Temp > 640 ? 'text-red-600' : sh5Temp > 620 ? 'text-orange-500' : 'text-green-600'}`}>
                        {sh5Temp ? sh5Temp.toFixed(1) : '--'} °C
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Info className="w-4 h-4 text-slate-400" />
                    </div>
                </div>
            </FormulaTooltip>

            {/* STEAM FLOW */}
            <FormulaTooltip
                formula={TOOLTIP_FORMULAS['steam-flow'].formula}
                hint={TOOLTIP_FORMULAS['steam-flow'].hint}
            >
                <div
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-help transition-all hover:border-slate-400 relative group"
                    onClick={() => onHelp('steam_flow')}
                >
                    <div className="flex items-center gap-2 text-slate-500 mb-1 text-sm font-semibold">
                        <Droplets size={16} className="text-blue-500" /> Débit Vapeur
                    </div>
                    <div className="text-2xl font-bold text-slate-700">
                        {steamFlow ? steamFlow.toFixed(1) : '--'} <span className="text-sm font-normal text-slate-400">T/h</span>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Info className="w-4 h-4 text-slate-400" />
                    </div>
                </div>
            </FormulaTooltip>

            {/* O2 LEVEL */}
            <FormulaTooltip
                formula={TOOLTIP_FORMULAS['o2-level'].formula}
                hint={TOOLTIP_FORMULAS['o2-level'].hint}
            >
                <div
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-help transition-all hover:border-slate-400 relative group"
                    onClick={() => onHelp('o2_level')}
                >
                    <div className="flex items-center gap-2 text-slate-500 mb-1 text-sm font-semibold">
                        <span>O₂</span> Oxygène
                    </div>
                    <div className="text-2xl font-bold text-slate-700">
                        {o2 ? o2.toFixed(1) : '--'} <span className="text-sm font-normal text-slate-400">%</span>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Info className="w-4 h-4 text-slate-400" />
                    </div>
                </div>
            </FormulaTooltip>

            {/* ECONOMIC INDICATOR */}
            <FormulaTooltip
                formula={TOOLTIP_FORMULAS['eco-score'].formula}
                hint={TOOLTIP_FORMULAS['eco-score'].hint}
            >
                <div
                    className="bg-slate-50 p-4 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden cursor-help transition-all hover:border-slate-400 group"
                    onClick={() => onHelp('economic_score')}
                >
                    <div className="flex items-center gap-2 text-slate-500 mb-1 text-sm font-semibold relative z-10">
                        <span>€</span> Score Eco
                    </div>
                    <div className={`text-2xl font-bold relative z-10 ${efficiencyScore > 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {efficiencyScore.toFixed(0)} <span className="text-sm font-normal text-slate-400">/100</span>
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-500" style={{ width: `${efficiencyScore}%` }} />

                    {/* Micro detail */}
                    <div className="text-[9px] text-slate-400 mt-1 relative z-10">
                        Marge: {margin.toFixed(0)}€/h
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Info className="w-4 h-4 text-slate-400" />
                    </div>
                </div>
            </FormulaTooltip>
            {/* WASTE MIX (NATURE DECHETS) - With Dynamic PCI & Fire Status */}
            <div
                className={`p-4 rounded-xl shadow-sm border cursor-help transition-all hover:border-slate-400 relative group ${fireStatus.risk === 'high' ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}
                title={fireStatus.advice}
            >
                <div className="flex items-center gap-2 text-slate-500 mb-1 text-sm font-semibold">
                    <Droplets size={16} className="text-purple-500" /> Mix Déchets
                    {fireStatus.risk === 'high' && <AlertTriangle size={14} className="text-amber-500" />}
                </div>
                <div className={`text-sm font-bold uppercase leading-none mt-1 ${fireStatus.color}`}>
                    {fireStatus.status}
                </div>
                <div className="text-xs text-slate-400 font-mono mt-1">
                    PCI: ~{dynamicPCI} kJ/kg
                </div>
                <div className="text-[9px] text-slate-400 mt-1 truncate" title={fireStatus.advice}>
                    {fireStatus.advice.substring(0, 40)}...
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Info className="w-4 h-4 text-slate-400" />
                </div>
            </div>
        </div>
    );
});
