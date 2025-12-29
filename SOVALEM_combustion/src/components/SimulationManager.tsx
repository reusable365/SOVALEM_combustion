import React from 'react';
import { Settings2, Zap, Wind, AlertCircle, TrendingDown } from 'lucide-react';
import { useBoilerData } from '../hooks/useBoilerData';

interface Props {
    data: ReturnType<typeof useBoilerData>;
}

export const SimulationManager: React.FC<Props> = ({ data }) => {
    const {
        steamTarget, setSteamTarget,
        o2Real, setO2Real,
        kap, setKap,
        asMode, setAsMode,
        grateSpeed, setGrateSpeed,
        pusherSpeed, setPusherSpeed,
        totalPrimaryAirFlow, setTotalPrimaryAirFlow,
        isUnstable, setIsUnstable,
        simulation
    } = data;

    return (
        <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-700 p-5 text-slate-100 overflow-hidden relative">
            {/* Background Accent */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 blur-3xl pointer-events-none" />

            <h2 className="text-sm font-black mb-4 flex items-center gap-2 uppercase tracking-widest text-blue-400">
                <Settings2 size={18} /> Explorateur Air Secondaire (AS)
            </h2>

            {/* Mode Selection */}
            <div className="flex bg-slate-800 p-1 rounded-lg mb-6 border border-slate-700">
                <button
                    onClick={() => setAsMode(1)}
                    className={`flex-1 flex flex-col items-center py-2 px-1 rounded-md transition-all ${asMode === 1 ? 'bg-slate-700 text-white shadow-lg border border-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <span className="text-[10px] font-black uppercase tracking-tighter">Mode 1</span>
                    <span className="text-[8px] font-bold opacity-70">Loi Vapeur</span>
                </button>
                <button
                    onClick={() => setAsMode(2)}
                    className={`flex-1 flex flex-col items-center py-2 px-1 rounded-md transition-all ${asMode === 2 ? 'bg-blue-600 text-white shadow-lg border border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <span className="text-[10px] font-black uppercase tracking-tighter">Mode 2</span>
                    <span className="text-[8px] font-bold opacity-90 italic">Bilan Air (Bible)</span>
                </button>
            </div>

            {/* KEY METRICS DISPLAY */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-950/50 p-3 rounded-xl border border-blue-500/20 flex flex-col items-center justify-center">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">AS Calculé</span>
                    <span className="text-2xl font-black font-mono text-blue-400">{simulation.asFlow}</span>
                    <span className="text-[8px] font-bold text-slate-600">Nm3/h</span>
                </div>
                <div className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-colors ${simulation.isSafe ? 'bg-slate-950/50 border-slate-800' : 'bg-red-950/30 border-red-500/50 animate-pulse'}`}>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Estim. SH5</span>
                    <span className={`text-2xl font-black font-mono ${simulation.isSafe ? 'text-white' : 'text-red-500'}`}>{simulation.sh5Temp}°C</span>
                    <span className="text-[8px] font-bold text-slate-600">Surchauffe</span>
                </div>
            </div>

            <div className="space-y-5">
                {/* Steam Target */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Zap size={10} className="text-yellow-500" /> Consigne Vapeur (T/h)
                        </label>
                        <span className="text-sm font-black text-white font-mono">{steamTarget}</span>
                    </div>
                    <input
                        type="range" min="20" max="40" step="0.1"
                        value={steamTarget}
                        onChange={(e) => setSteamTarget(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>

                {/* O2 Real */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Wind size={10} className="text-green-500" /> O2 Sortie Foyer (%)
                        </label>
                        <span className="text-sm font-black text-white font-mono">{o2Real}%</span>
                    </div>
                    <input
                        type="range" min="3" max="10" step="0.1"
                        value={o2Real}
                        onChange={(e) => setO2Real(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                </div>

                {/* KAP (Manual Balance offset) */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <TrendingDown size={10} className="text-purple-500" /> Offset KAP (Nm3/h)
                        </label>
                        <span className="text-sm font-black text-white font-mono">{kap > 0 ? `+${kap}` : kap}</span>
                    </div>
                    <input
                        type="range" min="-5000" max="5000" step="100"
                        value={kap}
                        onChange={(e) => setKap(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                </div>

                {/* Total AP Flow */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            Débit AP Total (Nm3/h)
                        </label>
                        <span className="text-sm font-black text-white font-mono">{totalPrimaryAirFlow}</span>
                    </div>
                    <input
                        type="range" min="10000" max="30000" step="100"
                        value={totalPrimaryAirFlow}
                        onChange={(e) => setTotalPrimaryAirFlow(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                </div>

                {/* Grate Speed */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            Vitesse Grille (%)
                        </label>
                        <span className="text-sm font-black text-white font-mono">{grateSpeed}%</span>
                    </div>
                    <input
                        type="range" min="0" max="100" step="1"
                        value={grateSpeed}
                        onChange={(e) => setGrateSpeed(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                </div>

                {/* Pusher Speed */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            Vitesse Poussoir (%)
                        </label>
                        <span className="text-sm font-black text-white font-mono">{pusherSpeed.toFixed(1)}%</span>
                    </div>
                    <input
                        type="range" min="0" max="100" step="1"
                        value={pusherSpeed}
                        onChange={(e) => setPusherSpeed(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                </div>

                {/* Instability Toggle */}
                <div className="pt-2">
                    <button
                        onClick={() => setIsUnstable(!isUnstable)}
                        className={`w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isUnstable ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                        <AlertCircle size={14} />
                        {isUnstable ? 'Simulation Vivante ACTIVE' : 'Rendre la Simulation Vivante'}
                    </button>
                </div>
            </div>

            {asMode === 1 && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-6 text-center z-10 pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-xs font-bold text-white bg-red-600/80 px-4 py-2 rounded-lg flex items-center gap-2 shadow-2xl">
                        <AlertCircle size={14} /> MODE 1 : AS FIXE (NON OPTIMISÉ)
                    </p>
                </div>
            )}
        </div>
    );
};
