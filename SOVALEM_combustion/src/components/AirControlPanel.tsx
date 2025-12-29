import React from 'react';
import { Lock, Unlock, ArrowRight, Flame, Thermometer } from 'lucide-react';
import { useBoilerData } from '../hooks/useBoilerData';
import { WasteMixGauge } from './WasteMixGauge';
import { WASTE_CATEGORIES } from '../utils/combustionLogic';

interface Props {
    data: ReturnType<typeof useBoilerData>;
}

export const AirControlPanel: React.FC<Props> = React.memo(({ data }) => {
    const { zones, updateZone, updateSubZone, locked, setLocked, wasteMix, setWasteMix } = data;
    // ... rest of the component

    const toggleLock = (id: number) => {
        // Prevent unlocking if it's the only one locked
        const lockedCount = Object.values(locked).filter(Boolean).length;
        if (locked[id] && lockedCount <= 1) return;

        setLocked(prev => ({ ...prev, [id as number]: !prev[id as number] }));
    };

    const omRatio = 1 - wasteMix.dibRatio;

    // Helper to calc roller %
    const getRollerPct = (zoneVal: number, subVal: number, isFirst: boolean) => {
        const ratio = isFirst ? subVal : (100 - subVal);
        return ((zoneVal * ratio) / 100).toFixed(1);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-5 h-full flex flex-col">
            <h2 className="text-lg font-bold mb-4 text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="text-blue-500">💨</span> Répartition Air Primaire
            </h2>

            {/* LIVE FEEDBACK STRIP (Sticky) - NEW REQUEST */}
            <div className="sticky top-0 z-20 bg-slate-800 text-white p-3 rounded-lg shadow-md mb-4 flex justify-between items-center opacity-95 backdrop-blur-sm border border-slate-700">
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Position Feu</span>
                    <div className="flex items-center gap-2">
                        <span className={`text-xl font-black ${data.currentBarycenter > 3.5 ? 'text-red-400' : data.currentBarycenter < 2.0 ? 'text-blue-400' : 'text-emerald-400'}`}>
                            {data.currentBarycenter.toFixed(2)}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${data.currentBarycenter > 3.5 ? 'bg-red-500 animate-pulse' : data.currentBarycenter < 2.0 ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                    </div>
                </div>
                <div className="h-8 w-px bg-slate-600" />
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">T° SH5</span>
                    <span className={`text-xl font-black font-mono ${data.simulation.sh5Temp > 620 ? 'text-orange-400' : 'text-white'}`}>
                        {data.simulation.sh5Temp.toFixed(0)}°C
                    </span>
                </div>
            </div>

            {/* ZONES GRID - HORIZONTAL LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* ZONE 1 */}
                <div className="relative border-b md:border-b-0 md:border-r border-dashed border-slate-200 pb-4 md:pb-0 md:pr-4">
                    <MainSlider
                        id={1} label="Zone 1 (Séchage)" icon={ArrowRight} color="text-blue-600" bg="bg-blue-600"
                        value={zones.zone1} locked={locked[1]} toggleLock={toggleLock} updateZone={updateZone}
                    />
                    <SubSlider
                        value={zones.subZone1}
                        onChange={(v: number) => updateSubZone(1, v)}
                        leftLabel={`R1: ${getRollerPct(zones.zone1, zones.subZone1, true)}%`}
                        rightLabel={`R2: ${getRollerPct(zones.zone1, zones.subZone1, false)}%`}
                        color="bg-blue-500"
                    />
                </div>

                {/* ZONE 2 */}
                <div className="relative border-b md:border-b-0 md:border-r border-dashed border-slate-200 pb-4 md:pb-0 md:pr-4">
                    <MainSlider
                        id={2} label="Zone 2 (Combustion)" icon={Flame} color="text-orange-600" bg="bg-orange-600"
                        value={zones.zone2} locked={locked[2]} toggleLock={toggleLock} updateZone={updateZone}
                    />
                    <SubSlider
                        value={zones.subZone2}
                        onChange={(v: number) => updateSubZone(2, v)}
                        leftLabel={`R3: ${getRollerPct(zones.zone2, zones.subZone2, true)}%`}
                        rightLabel={`R4: ${getRollerPct(zones.zone2, zones.subZone2, false)}%`}
                        color="bg-orange-500"
                    />
                </div>

                {/* ZONE 3 */}
                <div className="relative">
                    <MainSlider
                        id={3} label="Zone 3 (Finition)" icon={Thermometer} color="text-red-600" bg="bg-red-600"
                        value={zones.zone3} locked={locked[3]} toggleLock={toggleLock} updateZone={updateZone}
                    />
                    <SubSlider
                        value={zones.subZone3}
                        onChange={(v: number) => updateSubZone(3, v)}
                        leftLabel={`R5: ${getRollerPct(zones.zone3, zones.subZone3, true)}%`}
                        rightLabel={`R6: ${getRollerPct(zones.zone3, zones.subZone3, false)}%`}
                        color="bg-red-500"
                    />
                </div>
            </div>

            {/* Waste Mix Section (Moved to Bottom) */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Choix du Pontier (Type de Déchet)</span>
                    <div className="h-px bg-slate-200 flex-1" />
                </div>

                <WasteMixGauge omRatio={omRatio} dibRatio={wasteMix.dibRatio} />

                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
                    {/* Map over categories */}
                    {(['WET', 'STANDARD', 'BOOST', 'HIGH_POWER', 'INERT'] as const).map(cat => {
                        const info = WASTE_CATEGORIES[cat];
                        const isActive = wasteMix.category === cat;

                        // Style per category
                        const style = cat === 'WET' ? 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100' :
                            cat === 'STANDARD' ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100' :
                                cat === 'BOOST' ? 'border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100' :
                                    cat === 'HIGH_POWER' ? 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100' :
                                        'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'; // INERT

                        return (
                            <button
                                key={cat}
                                onClick={() => {
                                    let newDib = 0.2;
                                    if (cat === 'WET') newDib = 0.05;
                                    if (cat === 'STANDARD') newDib = 0.2;
                                    if (cat === 'BOOST') newDib = 0.6;
                                    if (cat === 'HIGH_POWER') newDib = 1.0;
                                    if (cat === 'INERT') newDib = 0.0;

                                    setWasteMix({
                                        category: cat,
                                        dibRatio: newDib
                                    });
                                }}
                                className={`
                                    p-2 rounded-lg border text-xs font-bold transition-all relative overflow-hidden
                                    ${isActive ? 'ring-2 ring-offset-1 ring-slate-400 shadow-md transform scale-105 z-10' : 'opacity-80 hover:opacity-100'}
                                    ${style}
                                    ${cat === 'INERT' ? 'col-span-2 md:col-span-1' : ''}
                                `}
                            >
                                <div className="flex flex-col items-center">
                                    <span className="uppercase tracking-tighter">{info.label}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Mixing Slider */}
                <div className="mt-4 px-1">
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Ajustement Fin (Dosage)</label>
                        <span className="text-xs font-mono font-bold text-slate-700">{(wasteMix.dibRatio * 100).toFixed(0)}%</span>
                    </div>
                    <input
                        type="range" min="0" max="1" step="0.05"
                        value={wasteMix.dibRatio}
                        onChange={(e) => setWasteMix({ ...wasteMix, dibRatio: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                </div>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100 flex justify-between text-sm text-slate-500 font-mono">
                <span>Total: {Math.round(zones.zone1 + zones.zone2 + zones.zone3)}%</span>
                {Math.abs(zones.zone1 + zones.zone2 + zones.zone3 - 100) > 0.1 && (
                    <span className="text-red-500 font-bold">⚠️ Ajustement...</span>
                )}
            </div>
        </div>
    );
});

// Helper Components
const MainSlider = ({ id, label, icon: Icon, color, bg, value, locked, toggleLock, updateZone }: any) => (
    <div className="mb-2">
        <div className="flex justify-between items-end mb-1">
            <div className="flex items-center gap-2 font-bold text-slate-700">
                <button
                    onClick={() => toggleLock(id)}
                    className={`p-1 rounded transition-all ${locked ? 'bg-slate-800 text-white ring-2 ring-offset-1 ring-slate-400' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}
                    title={locked ? "Zone verrouillée (Pivot)" : "Verrouiller cette zone"}
                >
                    {locked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
                <Icon size={18} className={color} />
                <span>{label}</span>
            </div>
            <div className="flex items-center">
                <input
                    type="number"
                    min="0" max="100"
                    value={Math.round(value)}
                    disabled={locked}
                    onChange={(e) => updateZone(id, parseInt(e.target.value) || 0)}
                    className={`w-12 text-right font-bold text-xl bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition-colors ${color} ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <span className={`text-xl font-bold ml-0.5 ${color}`}>%</span>
            </div>
        </div>
        <input
            type="range" min="0" max="100" disabled={locked} value={value}
            onChange={(e) => updateZone(id, parseInt(e.target.value))}
            className={`w-full h-3 rounded-lg cursor-pointer appearance-none ${locked ? 'bg-slate-100 opacity-50 cursor-not-allowed' : 'bg-slate-200'}`}
            style={{ accentColor: locked ? '#94a3b8' : undefined }}
        />
        {/* Helper bar to visualize 100% */}
        <div className={`mt-1 h-1 rounded-full ${bg} transition-all duration-300`} style={{ width: `${value}%` }}></div>
    </div>
);

const SubSlider = ({ value, onChange, leftLabel, rightLabel, color }: any) => (
    <div className="bg-slate-50 p-2 rounded border border-slate-100 mt-2">
        <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1 font-mono">
            <span>{leftLabel}</span>
            <span>{rightLabel}</span>
        </div>
        <div className="relative flex items-center h-2">
            <div className="absolute w-full h-full bg-slate-200 rounded-full"></div>
            <div className={`absolute h-full rounded-full ${color} opacity-80`} style={{ width: `${value}%` }}></div>
            <input
                type="range" min="0" max="100"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="absolute w-full h-4 opacity-0 cursor-pointer z-10"
            />
            {/* Split Handle Visual */}
            <div className="w-3 h-3 bg-white border-2 border-slate-400 rounded-full shadow absolute pointer-events-none transition-all" style={{ left: `calc(${value}% - 6px)` }}></div>
        </div>
    </div>
);
