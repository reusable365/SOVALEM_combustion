import React, { useState } from 'react';
import { Info } from 'lucide-react';

export interface CalculationStep {
    label: string;
    value: string | number;
    unit?: string;
}

export interface CalculationDetails {
    title: string;
    formula: string;
    steps: CalculationStep[];
    interpretation?: string;
}

interface Props {
    details: CalculationDetails;
    position?: 'top' | 'bottom' | 'left' | 'right';
    size?: number;
}

export const CalculationTooltip: React.FC<Props> = ({
    details,
    position = 'bottom',
    size = 14
}) => {
    const [isVisible, setIsVisible] = useState(false);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    const arrowClasses = {
        top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-800/90 border-x-transparent border-b-transparent',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800/90 border-x-transparent border-t-transparent',
        left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-800/90 border-y-transparent border-r-transparent',
        right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-800/90 border-y-transparent border-l-transparent'
    };

    return (
        <div
            className="relative inline-flex items-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onTouchStart={() => setIsVisible(prev => !prev)}
        >
            <Info
                size={size}
                className="text-slate-400 hover:text-blue-500 cursor-help transition-colors"
            />

            {isVisible && (
                <div className={`absolute z-50 ${positionClasses[position]} w-72 animate-fadeIn`}>
                    {/* Arrow */}
                    <div className={`absolute border-[6px] ${arrowClasses[position]}`} />

                    {/* Tooltip Content */}
                    <div className="bg-slate-800/95 backdrop-blur-md text-white rounded-lg shadow-xl border border-slate-600/50 overflow-hidden">
                        {/* Header */}
                        <div className="bg-slate-700/50 px-3 py-2 border-b border-slate-600/50">
                            <h5 className="font-bold text-sm flex items-center gap-2">
                                📐 {details.title}
                            </h5>
                        </div>

                        {/* Formula */}
                        <div className="px-3 py-2 bg-slate-900/50 border-b border-slate-600/30">
                            <p className="text-[11px] text-slate-300 font-mono">
                                {details.formula}
                            </p>
                        </div>

                        {/* Steps */}
                        <div className="px-3 py-2 space-y-1">
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                                📊 Valeurs
                            </p>
                            {details.steps.map((step, idx) => (
                                <div key={idx} className="flex justify-between text-xs">
                                    <span className="text-slate-400">{step.label}</span>
                                    <span className="font-mono text-emerald-400">
                                        {typeof step.value === 'number'
                                            ? step.value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
                                            : step.value}
                                        {step.unit && <span className="text-slate-500 ml-1">{step.unit}</span>}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Interpretation */}
                        {details.interpretation && (
                            <div className="px-3 py-2 bg-blue-900/30 border-t border-slate-600/30">
                                <p className="text-[10px] text-blue-300">
                                    📖 {details.interpretation}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalculationTooltip;
