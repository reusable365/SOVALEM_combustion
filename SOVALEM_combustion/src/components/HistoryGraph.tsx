import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useBoilerData } from '../hooks/useBoilerData';
import { Filter, AlertTriangle } from 'lucide-react';
import { runSimulation } from '../utils/simulationEngine';

import { sampleData } from '../utils/dataSampling';

interface Props {
    data: ReturnType<typeof useBoilerData>;
}

export const HistoryGraph: React.FC<Props> = React.memo(({ data }) => {
    const { history, filteredHistory, filterShutdowns, setFilterShutdowns, kap, asMode } = data;
    const [ghostMode, setGhostMode] = React.useState(false);

    const rawDisplayData = filterShutdowns ? filteredHistory : history;

    // Optimisation: Sampling pour l'affichage graphique uniquement
    const displayData = React.useMemo(() => {
        const sampled = sampleData(rawDisplayData, 500);

        if (!ghostMode) return sampled;

        // In Ghost Mode, we calculate what the SH5 WOULD have been for each point
        // based on the current simulation formula, but using the real data as baseline.
        // We calculate an offset based on current simulation vs current real? 
        // No, let's recalculate per point if possible.
        return sampled.map(d => {
            const apSum = d.zone1Flow + d.zone2Flow + d.zone3Flow;
            // Simulated SH5 for this specific historical point
            const sim = runSimulation({
                steamTarget: d.steamFlow || 30.6,
                apSumZones: apSum,
                o2Real: d.o2Level || 6.0,
                mode: asMode,
                kap: kap,
                grateSpeed: 50,
                pusherSpeed: 50,
                fireBarycenter: 3.5, // Default/Average
                isUnstable: false,
                previousWasteDeposit: 50,
                foulingFactor: 10,  // Assume base historical fouling
                dibRatio: 0.2,      // Assume normal mix
                category: 'STANDARD' // Default for ghost simulation
            });
            return {
                ...d,
                ghostSH5: sim.sh5Temp
            };
        });
    }, [rawDisplayData, ghostMode, kap, asMode]);

    if (!displayData || displayData.length === 0) {
        return <div className="h-48 flex items-center justify-center text-slate-400 italic">Aucune donnée chargée.</div>
    }

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-80 relative flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-700 text-sm">Historique & Simulation</h3>
                    <button
                        onClick={() => setGhostMode(!ghostMode)}
                        className={`text-[9px] font-black px-2 py-1 rounded-full border transition-all flex items-center gap-1 ${ghostMode ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-100 border-slate-200 text-slate-500'}`}
                    >
                        {ghostMode ? 'GHOST MODE ON' : 'ACTIVER GHOST'}
                    </button>
                </div>
                <button
                    onClick={() => setFilterShutdowns(!filterShutdowns)}
                    className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded transition ${filterShutdowns ? 'bg-indigo-100 text-indigo-700 font-bold' : 'bg-slate-100 text-slate-500'}`}
                    title={filterShutdowns ? "Arrêts Techniques Masqués" : "Tout Afficher"}
                >
                    <Filter size={10} /> {filterShutdowns ? 'Filtre Actif' : 'Voir Tout'}
                </button>
            </div>

            <div className="flex-1" style={{ minHeight: 200 }}>
                <ResponsiveContainer width="100%" height={300} minHeight={300} minWidth={100}>
                    <LineChart data={displayData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="timestamp" tick={{ fontSize: 8 }} />
                        <YAxis domain={[400, 750]} />
                        <Tooltip contentStyle={{ fontSize: 10 }} />

                        <ReferenceLine y={620} stroke="#22c55e" strokeDasharray="3 3" label={{ value: "Cible < 620°C", fontSize: 10, fill: "#22c55e", position: 'insideTopLeft' }} />
                        <ReferenceLine y={640} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Critique", fontSize: 10, fill: "#ef4444", position: 'insideTopLeft' }} />

                        <Line type="monotone" dataKey="sh5Temp" stroke="#94a3b8" dot={false} strokeWidth={2} name="Réel" />
                        {ghostMode && (
                            <Line type="monotone" dataKey="ghostSH5" stroke="#3b82f6" dot={false} strokeWidth={2} strokeDasharray="4 4" name="Simulé (Ghost)" />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
            {ghostMode && (
                <div className="text-[10px] text-blue-600 bg-blue-50 p-2 rounded mt-2 italic font-medium flex items-center gap-2">
                    <AlertTriangle size={12} /> La courbe simulée montre l'impact théorique des réglages actuels sur l'historique.
                </div>
            )}
        </div>
    );
});
