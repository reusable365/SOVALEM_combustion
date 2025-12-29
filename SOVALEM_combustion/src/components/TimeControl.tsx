import React from 'react';
import { Play, Pause, FastForward } from 'lucide-react';

interface TimeControlProps {
    timeSpeed: 1 | 5 | 10 | 30 | 60;
    setTimeSpeed: (speed: 1 | 5 | 10 | 30 | 60) => void;
    isUnstable: boolean;
    setIsUnstable: (val: boolean) => void;
}

export const TimeControl: React.FC<TimeControlProps> = ({ timeSpeed, setTimeSpeed, isUnstable, setIsUnstable }) => {
    return (
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl p-3 flex items-center gap-4 shadow-xl">
            <div className="flex items-center gap-2 border-r border-slate-700 pr-4">
                <div className={`w-3 h-3 rounded-full ${isUnstable ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {timeSpeed === 1 ? 'Temps Réel' : `Accéléré x${timeSpeed}`}
                </span>
            </div>

            {/* Play/Pause (toggle instability loop) */}
            <button
                onClick={() => setIsUnstable(!isUnstable)}
                className={`p-2 rounded-lg transition-colors ${isUnstable
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    }`}
                title={isUnstable ? "Pause Simulation" : "Start Simulation"}
            >
                {isUnstable ? <Pause size={18} /> : <Play size={18} />}
            </button>

            {/* Speed Controls */}
            <div className="flex bg-slate-900/50 rounded-lg p-1">
                {[1, 5, 10, 30, 60].map((speed) => (
                    <button
                        key={speed}
                        onClick={() => setTimeSpeed(speed as any)}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeSpeed === speed
                                ? 'bg-indigo-600 text-white shadow-lg scale-105'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                            }`}
                    >
                        {speed}x
                    </button>
                ))}
            </div>

            <div className="text-[10px] text-slate-500 font-mono">
                {timeSpeed > 1 && (
                    <span className="flex items-center gap-1 text-indigo-400">
                        <FastForward size={12} />
                        {(timeSpeed * 1).toFixed(0)} min/sec
                    </span>
                )}
            </div>
        </div>
    );
};
