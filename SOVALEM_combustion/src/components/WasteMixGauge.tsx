import React from 'react';
import { Truck } from 'lucide-react';

interface Props {
    omRatio: number; // 0 à 1
    dibRatio: number; // 0 à 1
}

export const WasteMixGauge: React.FC<Props> = ({ omRatio, dibRatio }) => {
    const pciEstimate = Math.round(omRatio * 8500 + dibRatio * 12000);

    return (
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-slate-600 flex items-center gap-2">
                    <Truck size={14} /> Qualité Arrivages (Est.)
                </h4>
                <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-mono">
                    PCI Moyen: {pciEstimate} kJ/kg
                </span>
            </div>
            <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden flex">
                <div
                    className="h-full bg-green-500 flex items-center justify-center text-[9px] text-white font-bold transition-all duration-500"
                    style={{ width: `${omRatio * 100}%` }}
                >
                    {omRatio > 0.1 && `OM ${Math.round(omRatio * 100)}%`}
                </div>
                <div
                    className="h-full bg-purple-500 flex items-center justify-center text-[9px] text-white font-bold transition-all duration-500"
                    style={{ width: `${dibRatio * 100}%` }}
                >
                    {dibRatio > 0.1 && `DIB ${Math.round(dibRatio * 100)}%`}
                </div>
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 mt-1 px-1">
                <span>Humide / PCI Faible</span>
                <span>Sec / PCI Fort</span>
            </div>
        </div>
    );
};
