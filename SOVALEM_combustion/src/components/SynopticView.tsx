import React, { useMemo, useState } from 'react';
import { useBoilerData } from '../hooks/useBoilerData';
import { calculateRollerFlows } from '../utils/combustionLogic';
import { Thermometer, Eye, Map, ArrowRight } from 'lucide-react';

interface Props {
    data: ReturnType<typeof useBoilerData>;
    onHelp: (topic: string) => void;
}

export const SynopticView: React.FC<Props> = React.memo(({ data, onHelp }) => {
    const { zones, currentBarycenter, simulation, asMode, o2Real } = data;
    const [showVisual, setShowVisual] = useState(false);

    // Calculate flows for the 6 rollers for visualization
    const rollers = useMemo(() => calculateRollerFlows(
        zones.zone1, zones.zone2, zones.zone3,
        zones.subZone1, zones.subZone2, zones.subZone3
    ), [zones]);

    // Memoized flame calculations
    const flameData = useMemo(() => {
        const getFlameColor = (idx: number, barycenter: number) => {
            const distanceFromOptimal = Math.abs((idx + 1) - barycenter);
            if (distanceFromOptimal < 1) return '#ef4444';
            if (distanceFromOptimal < 2) return '#f97316';
            return '#fbbf24';
        };

        const getFlameIntensity = (idx: number, barycenter: number) => {
            const distance = Math.abs((idx + 1) - barycenter);
            return Math.exp(-(distance * distance) / 2);
        };

        const getFlameHeight = (idx: number, barycenter: number) => {
            const intensity = getFlameIntensity(idx, barycenter);
            return 80 * intensity + 10;
        };

        // Pre-calculate all flame data for 6 rollers
        return rollers.map((_, idx) => ({
            color: getFlameColor(idx, currentBarycenter),
            intensity: getFlameIntensity(idx, currentBarycenter),
            height: getFlameHeight(idx, currentBarycenter),
        }));
    }, [currentBarycenter, rollers]);

    // Memoized fire status
    const fireStatus = useMemo(() => {
        if (currentBarycenter < 2.5) {
            return { status: 'forward', message: 'Feu trop en avant - SH5 élevée', color: 'text-orange-500' };
        } else if (currentBarycenter > 4.5) {
            return { status: 'backward', message: 'Feu qui descend - Problème combustion', color: 'text-red-500' };
        }
        return { status: 'optimal', message: 'Position feu optimale (R3-R4)', color: 'text-green-500' };
    }, [currentBarycenter]);

    return (
        <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 p-8 relative overflow-hidden min-h-[550px]">
            {/* BACKGROUND GLOW */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] pointer-events-none" />

            <div className="flex justify-between items-center mb-6 z-10 relative">
                <div className="flex flex-col">
                    <h3 className="font-black text-white flex items-center gap-2 uppercase tracking-tighter text-xl">
                        <Thermometer className="text-blue-500" size={24} /> Supervision Process
                    </h3>
                    <div className="flex gap-4 mt-1">
                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-widest">
                            <ArrowRight size={10} className="text-blue-500" /> Mode: {asMode === 2 ? 'Bilan Air (Automatique)' : 'Loi Vapeur'}
                        </span>
                        <span className={`text-[10px] font-bold flex items-center gap-1 uppercase tracking-widest ${fireStatus.color}`}>
                            ● {fireStatus.message}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => setShowVisual(!showVisual)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${showVisual ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                >
                    {showVisual ? <Eye size={14} /> : <Map size={14} />} {showVisual ? 'Détails Foyer' : 'Synoptique Usine'}
                </button>
            </div>

            <div className="relative w-full h-[450px] border border-slate-800 rounded-3xl bg-slate-950/50 backdrop-blur-md overflow-hidden shadow-inner">
                {/* SVG Schema remains similar but styled for DARK mode */}
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
                    <svg viewBox="0 0 1000 600" className="w-full h-full text-blue-400" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M50 150 L100 250 L100 350" />
                        <rect x="50" y="320" width="60" height="30" className="fill-blue-500/20" />
                        <path d="M140 320 L140 200 L400 150 L600 200 L700 350" />
                        <path d="M140 200 L140 50 L400 50 L400 150" />
                        <path d="M400 50 L950 50 L950 250 L700 250" />
                        <path d="M450 60 L450 140 M500 60 L500 140" className="opacity-50" />
                        <line x1="140" y1="350" x2="700" y2="450" className="text-slate-500" />
                    </svg>
                </div>

                {/* 1. GRATE */}
                <div className="absolute top-[58%] left-[12%] w-[58%] h-[20%] flex z-20 pointer-events-none transform rotate-[6deg] origin-top-left">
                    <div className="absolute inset-x-0 bottom-full h-56 flex items-end justify-between px-2 pb-2">
                        {flameData.map((flame, idx) => (
                            <div key={idx} className="flex-1 flex flex-col justify-end items-center relative">
                                {/* Outer glow (largest, most diffuse) */}
                                <div
                                    className="absolute w-[200%] rounded-full blur-3xl animate-pulse"
                                    style={{
                                        backgroundColor: flame.color,
                                        height: `${flame.height * 1.5}px`,
                                        opacity: 0.4 + (flame.intensity * 0.4),
                                        bottom: 0,
                                    }}
                                ></div>
                                {/* Main flame body */}
                                <div
                                    className="w-[160%] rounded-full blur-xl transition-all duration-500"
                                    style={{
                                        backgroundColor: flame.color,
                                        height: `${flame.height}px`,
                                        opacity: 0.6 + (flame.intensity * 0.4),
                                        transform: `scale(${0.8 + flame.intensity * 0.5})`,
                                    }}
                                ></div>
                                {/* Inner flame core (bright white/yellow) */}
                                {flame.intensity > 0.2 && (
                                    <div
                                        className="absolute bottom-0 w-[100%] rounded-full blur-lg"
                                        style={{
                                            background: 'linear-gradient(to top, #fff 0%, #fbbf24 50%, transparent 100%)',
                                            height: `${flame.height * 0.6}px`,
                                            opacity: flame.intensity * 0.7,
                                        }}
                                    ></div>
                                )}
                                {/* Flame tip (animated flicker) */}
                                {flame.intensity > 0.5 && (
                                    <div
                                        className="absolute bottom-0 w-[60%] rounded-full blur-md animate-bounce"
                                        style={{
                                            backgroundColor: '#fff',
                                            height: `${flame.height * 0.3}px`,
                                            opacity: flame.intensity * 0.5,
                                            animationDuration: '0.5s',
                                        }}
                                    ></div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Roller labels with integrated zone colors */}
                    <div className="w-full h-14 flex items-stretch border-t border-slate-700">
                        {rollers.map((val, idx) => {
                            const isFirePosition = Math.abs((idx + 1) - currentBarycenter) < 1;
                            // Zone colors: R1-R2 = orange (Avant), R3-R4 = green (Optimal), R5-R6 = red (Descend)
                            const getZoneColor = () => {
                                if (idx < 2) return 'bg-orange-500/20 border-orange-500/50';
                                if (idx < 4) return 'bg-green-500/20 border-green-500/50';
                                return 'bg-red-500/20 border-red-500/50';
                            };
                            const getZoneLabel = () => {
                                if (idx < 2) return 'Séchage';
                                if (idx < 4) return 'Combustion';
                                return 'Finition';
                            };
                            return (
                                <div
                                    key={idx}
                                    className={`flex-1 border-r relative backdrop-blur-sm flex flex-col items-center justify-center cursor-help transition-all ${getZoneColor()} ${isFirePosition ? 'ring-2 ring-white/50' : ''}`}
                                    onClick={() => onHelp(`roller-${idx + 1}`)}
                                >
                                    <span className={`text-[11px] font-black ${isFirePosition ? 'text-white' : 'text-slate-400'}`}>R{idx + 1}</span>
                                    <span className="text-[8px] text-slate-500">{getZoneLabel()}</span>
                                    {/* Fire indicator */}
                                    {isFirePosition && (
                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px]">🔥</div>
                                    )}
                                    <div className={`w-full absolute bottom-0 bg-blue-500/30 transition-all duration-700`} style={{ height: `${Math.min(val * 3, 100)}%` }}></div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* SIMULATION SENSORS OVERLAY */}
                <div className="absolute top-[10%] right-[2%] z-20 space-y-4">
                    {/* SH5 MONITORING */}
                    <div
                        className={`p-4 rounded-2xl border-2 backdrop-blur-xl transition-all duration-500 cursor-help active:scale-95 ${simulation.isSafe ? 'bg-slate-900/80 border-slate-800 shadow-xl hover:bg-slate-800/80' : 'bg-red-950/80 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-pulse'}`}
                        onClick={() => onHelp('sh5-temp')}
                    >
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Température SH5</div>
                        <div className="flex items-end gap-2">
                            <span className={`text-4xl font-black font-mono tracking-tighter ${simulation.isSafe ? 'text-white' : 'text-red-500'}`}>
                                {simulation.sh5Temp}
                            </span>
                            <span className="text-xs font-bold text-slate-500 mb-2">°C</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
                            <div className={`h-full transition-all duration-700 ${simulation.isSafe ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${Math.min((simulation.sh5Temp / 750) * 100, 100)}%` }} />
                        </div>
                    </div>


                    {/* AIR BALANCE MONITORING */}
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Bilan Air Secondaire</div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-slate-400">DEMANDE AS</span>
                                <span className="text-blue-400 font-mono">{simulation.asFlow} Nm3/h</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-slate-400">RATIO O2</span>
                                <span className="text-cyan-400 font-mono">{o2Real}%</span>
                            </div>
                        </div>
                    </div>

                    {/* FOULING (ENCRASSEMENT) MONITORING */}
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl relative group">
                        <div className="flex justify-between items-center mb-2 cursor-help" onClick={() => onHelp('fouling')}>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">Encrassement</div>
                            <span className={`text-[10px] font-mono font-bold ${data.foulingFactor > 50 ? 'text-red-500' : 'text-green-500'}`}>
                                {data.foulingFactor.toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                            <div
                                className={`h-full transition-all duration-700 ${data.foulingFactor > 80 ? 'bg-red-500' : 'bg-amber-500'}`}
                                style={{ width: `${data.foulingFactor}%` }}
                            />
                        </div>
                        <button
                            onClick={data.handleSootBlowing}
                            className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors border border-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.3)] active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span className="animate-pulse">●</span> ACTION RAMONAGE
                        </button>
                    </div>
                </div>

                {/* BARYCENTER MARKER */}
                {(() => {
                    const displayBarycenter = currentBarycenter;
                    const safeBarycenter = Math.max(1, Math.min(6, displayBarycenter));
                    return (
                        <div
                            className="absolute top-[50%] transition-all duration-[500ms] z-30 flex flex-col items-center pointer-events-none"
                            style={{ left: `${14 + ((safeBarycenter - 0.5) / 6) * 56}%`, transform: 'translate(-50%, -50%)' }}
                        >
                            <div className="bg-blue-600/90 px-2 py-1 rounded-lg text-[9px] font-black text-white mb-2 shadow-2xl border border-blue-400/50 backdrop-blur-sm">
                                BARYCENTRE {simulation.isSafe ? '(SIM)' : '(ALERTE)'}: {displayBarycenter.toFixed(2)}
                            </div>
                            <div className={`h-4 w-4 bg-white border-4 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.8)] animate-bounce ${simulation.isSafe ? 'border-blue-600' : 'border-red-600 animate-pulse'}`}></div>
                        </div>
                    );
                })()}

            </div>
        </div>
    );
});
