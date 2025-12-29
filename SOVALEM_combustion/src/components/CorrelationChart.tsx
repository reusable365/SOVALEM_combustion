import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';
import { useBoilerData } from '../hooks/useBoilerData';

interface Props {
    data: ReturnType<typeof useBoilerData>;
}

export const CorrelationChart: React.FC<Props> = ({ data }) => {
    const { filteredHistory } = data;

    // Memoize the potentially expensive data processing
    const { points, trendData, slope, intercept } = React.useMemo(() => {
        if (!filteredHistory || filteredHistory.length < 2) {
            return { points: [], trendData: [], slope: 0, intercept: 0 };
        }

        // 1. Filter valid points first
        const validPoints = filteredHistory
            .map(d => ({ x: d.barycenter, y: d.sh5Temp }))
            .filter(p => !isNaN(p.x) && !isNaN(p.y));

        if (validPoints.length < 2) {
            return { points: [], trendData: [], slope: 0, intercept: 0 };
        }

        // 2. Calculate Regression on ALL valid data (for accuracy)
        const n = validPoints.length;
        const sumX = validPoints.reduce((acc, p) => acc + p.x, 0);
        const sumY = validPoints.reduce((acc, p) => acc + p.y, 0);
        const sumXY = validPoints.reduce((acc, p) => acc + p.x * p.y, 0);
        const sumXX = validPoints.reduce((acc, p) => acc + p.x * p.x, 0);

        const calculatedSlope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const calculatedIntercept = (sumY - calculatedSlope * sumX) / n;

        // 3. Sample data for Visual Rendering (to avoid freezing DOM)
        // Dynamically determining sample size based on total points
        const targetSize = 500;
        const step = Math.ceil(validPoints.length / targetSize);
        const displayPoints = step > 1
            ? validPoints.filter((_, index) => index % step === 0)
            : validPoints;

        // 4. Trendline endpoints
        const xMin = Math.min(...validPoints.map(p => p.x));
        const xMax = Math.max(...validPoints.map(p => p.x));
        const trend = [
            { x: xMin, y: calculatedSlope * xMin + calculatedIntercept },
            { x: xMax, y: calculatedSlope * xMax + calculatedIntercept }
        ];

        return {
            points: displayPoints,
            trendData: trend,
            slope: calculatedSlope,
            intercept: calculatedIntercept
        };
    }, [filteredHistory]);

    if (!filteredHistory || filteredHistory.length < 2) {
        return <div className="h-64 flex items-center justify-center text-slate-400 italic bg-white rounded-xl border border-slate-200">Pas assez de données (&gt;500°C) pour corrélation.</div>
    }

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-64">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-700 text-sm">Corrélation Barycentre vs SH5</h3>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono">
                    y = {slope.toFixed(1)}x + {intercept.toFixed(0)}
                </span>
            </div>
            <ResponsiveContainer width="100%" height={200} minWidth={100} minHeight={200}>
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="x" name="Barycentre" domain={['dataMin - 0.2', 'dataMax + 0.2']} allowDecimals={true}>
                        <Label value="Position Feu" position="bottom" offset={0} style={{ fontSize: 10 }} />
                    </XAxis>
                    <YAxis type="number" dataKey="y" name="T° SH5" domain={['auto', 'auto']} unit="°C" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Points" data={points} fill="#8884d8" shape="circle" />
                    <Scatter name="Tendance" data={trendData} line={{ stroke: '#ef4444', strokeWidth: 2 }} shape={() => <></>} legendType="none" />
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
};
