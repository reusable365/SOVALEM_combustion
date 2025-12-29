/**
 * Formula Tooltip Component
 * Shows calculation formula on hover
 */

import { useState, type ReactNode } from 'react';
import { Calculator } from 'lucide-react';

interface FormulaTooltipProps {
    children: ReactNode;
    formula: string;
    hint: string;
    position?: 'top' | 'bottom';
}

export function FormulaTooltip({ children, formula, hint, position = 'bottom' }: FormulaTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}

            {isVisible && (
                <div
                    className={`absolute z-50 w-72 p-3 bg-slate-900 text-white rounded-lg shadow-xl border border-slate-700 
            ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 -translate-x-1/2
            animate-in fade-in duration-150`}
                >
                    {/* Arrow */}
                    <div
                        className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 
              border-l-8 border-r-8 border-transparent
              ${position === 'top'
                                ? 'top-full border-t-8 border-t-slate-900'
                                : 'bottom-full border-b-8 border-b-slate-900'}`}
                    />

                    {/* Formula */}
                    <div className="flex items-center gap-2 mb-2">
                        <Calculator className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-semibold text-indigo-400">CALCUL</span>
                    </div>

                    <code className="block text-sm font-mono text-amber-300 bg-slate-800 px-2 py-1 rounded mb-2">
                        {formula}
                    </code>

                    <p className="text-xs text-slate-400">
                        💡 {hint}
                    </p>
                </div>
            )}
        </div>
    );
}
