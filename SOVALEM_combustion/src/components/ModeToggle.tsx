import React from 'react';
import { Zap, Wind } from 'lucide-react';

interface Props {
    mode: number;
    setMode: (mode: 1 | 2) => void;
    onHelp: (topic: string) => void;
}

export const ModeToggle: React.FC<Props> = React.memo(({ mode, setMode, onHelp }) => {
    return (
        <div
            className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 cursor-help"
            onClick={(e) => {
                if ((e.target as HTMLElement).tagName !== 'BUTTON') {
                    onHelp('mode_regulation');
                }
            }}
        >
            <div className="flex items-center gap-2 text-slate-500 mb-2 text-xs font-semibold uppercase tracking-wider">
                Mode Régulation AS
            </div>
            <div className="flex rounded-lg overflow-hidden border border-slate-200">
                <button
                    onClick={() => setMode(1)}
                    className={`flex-1 py-2 px-3 flex items-center justify-center gap-2 transition-all text-sm font-bold ${mode === 1
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                >
                    <Zap size={14} />
                    <span>MODE 1</span>
                </button>
                <button
                    onClick={() => setMode(2)}
                    className={`flex-1 py-2 px-3 flex items-center justify-center gap-2 transition-all text-sm font-bold ${mode === 2
                        ? 'bg-emerald-600 text-white shadow-lg'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                >
                    <Wind size={14} />
                    <span>MODE 2</span>
                </button>
            </div>
            <div className="text-[10px] text-slate-400 mt-2 text-center">
                {mode === 1 ? 'Loi Vapeur (Manuel)' : 'Bilan Air (Automatique)'}
            </div>
        </div>
    );
});
