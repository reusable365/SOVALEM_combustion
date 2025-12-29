import React from 'react';

interface Props {
    label: string;
    value: string | number;
    onChange: (val: string) => void;
    warning?: number;
    critical?: number;
    unit?: string;
    tag?: string;
    isLarge?: boolean;
}

export const InputTemp: React.FC<Props> = ({ label, value, onChange, warning = 620, critical = 650, unit = "", tag, isLarge = false }) => {
    const valNum = parseFloat(value as string);
    let statusColor = "text-slate-600 border-slate-300 focus:border-blue-500";

    if (valNum && valNum >= critical) statusColor = "text-red-600 border-red-500 bg-red-50 focus:border-red-600 font-bold";
    else if (valNum && valNum >= warning) statusColor = "text-orange-600 border-orange-400 bg-orange-50 focus:border-orange-500 font-bold";

    return (
        <div className="flex flex-col gap-1 w-full">
            <div className="flex justify-between items-end">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{label}</label>
                {tag && <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1 rounded border border-slate-200 ml-1">{tag}</span>}
            </div>
            <div className="relative">
                <input
                    type="number"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="---"
                    className={`w-full p-1.5 pr-6 rounded border ${statusColor} outline-none transition-colors text-right font-mono ${isLarge ? 'text-lg' : 'text-sm'}`}
                />
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">{unit}</span>
            </div>
        </div>
    );
};
