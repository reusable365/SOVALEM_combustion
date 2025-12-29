import React from 'react';

interface CircularGaugeProps {
    value: number;
    min: number;
    max: number;
    label: string;
    color: string;
    unit?: string;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
    value,
    min,
    max,
    label,
    color,
    unit = ''
}) => {
    // Calculate percentage for the arc
    const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);

    // SVG circle parameters
    const size = 120;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Arc length based on percentage (270° arc = 75% of circle)
    const arcLength = (circumference * 0.75);
    const dashOffset = arcLength - (arcLength * percentage) / 100;

    // Color determination
    const getColor = () => {
        if (percentage < 33) return '#22c55e'; // green
        if (percentage < 66) return '#f59e0b'; // orange
        return '#ef4444'; // red
    };

    const strokeColor = color || getColor();

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="relative" style={{ width: size, height: size }}>
                {/* Background circle */}
                <svg
                    width={size}
                    height={size}
                    className="transform -rotate-[225deg]"
                >
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${arcLength} ${circumference}`}
                    />
                    {/* Progress circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${arcLength} ${circumference}`}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                    />
                </svg>

                {/* Center value */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold" style={{ color: strokeColor }}>
                        {value.toFixed(1)}
                    </div>
                    {unit && (
                        <div className="text-xs text-slate-400 font-semibold">{unit}</div>
                    )}
                </div>
            </div>

            {/* Label */}
            <div className="mt-2 text-xs font-semibold text-slate-600 text-center">
                {label}
            </div>
        </div>
    );
};
