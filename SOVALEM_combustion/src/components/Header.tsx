import React from 'react';
import { Moon, Sun, Flame } from 'lucide-react';
import { TimeControl } from './TimeControl';
import { useBoilerData } from '../hooks/useBoilerData';

interface HeaderProps {
    darkMode: boolean;
    setDarkMode: (val: boolean) => void;
    boilerData: ReturnType<typeof useBoilerData>;
}

export const Header: React.FC<HeaderProps> = ({ darkMode, setDarkMode, boilerData }) => {
    return (
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/20">
                        <Flame className="text-white" size={24} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-700 via-slate-500 to-slate-400 dark:from-white dark:via-slate-200 dark:to-slate-400">
                        SOVALEM <span className="text-indigo-500 dark:text-indigo-400 font-mono text-xl">SIMULATOR 2.0</span>
                    </h1>
                </div>
                <div className="text-xs text-slate-500 font-medium tracking-widest pl-14 flex gap-4">
                    <span>UNITÉ DE VALORISATION ÉNERGÉTIQUE - MONTEREAU</span>
                    <span className="text-emerald-500">• LIVE CONNECTED (VIRTUAL)</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Training Controls */}
                <TimeControl
                    timeSpeed={boilerData.timeSpeed}
                    setTimeSpeed={boilerData.setTimeSpeed}
                    isUnstable={boilerData.isUnstable}
                    setIsUnstable={boilerData.setIsUnstable}
                />

                {/* Dark Mode Toggle */}
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-50'} shadow-sm border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}
                    title={darkMode ? 'Mode Jour' : 'Mode Nuit'}
                >
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
            </div>
        </header>
    );
};
