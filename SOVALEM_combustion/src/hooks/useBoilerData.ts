import { useState, useEffect, useMemo } from 'react';
import type { DataPoint, ZoneData, WasteMix } from '../types';
import { calculateBarycenterWithWaste, getFireStatus } from '../utils/combustionLogic';
import { runSimulation } from '../utils/simulationEngine';
import { parseCSVData } from '../utils/csvParser';

export const useBoilerData = () => {
    // Sliders Principaux (Global Zone Flow) & Secondaires (Splits)
    const [zones, setZones] = useState<ZoneData>({
        zone1: 61, zone2: 19, zone3: 20,
        subZone1: 40, subZone2: 60, subZone3: 70
    });

    // Simulation State
    const [steamTarget, setSteamTarget] = useState(30.6);
    const [o2Real, setO2Real] = useState(6.0);
    const [kap, setKap] = useState(0);
    const [asMode, setAsMode] = useState<1 | 2>(2);
    const [grateSpeed, setGrateSpeed] = useState(50);
    const [pusherSpeed, setPusherSpeed] = useState(50);
    const [totalPrimaryAirFlow, setTotalPrimaryAirFlow] = useState(28000);
    const [isUnstable, setIsUnstable] = useState(false);

    // State for Dynamic Physics: Waste Thickness (Couche)
    const [wasteDeposit, setWasteDeposit] = useState(50);
    // Fouling State (Encrassement) - 0 to 100%
    const [foulingFactor, setFoulingFactor] = useState(0);

    // Time Acceleration State
    const [timeSpeed, setTimeSpeed] = useState<1 | 5 | 10 | 30 | 60>(1);

    // Clock
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const intervalMs = 1000 / timeSpeed;
        const interval = setInterval(() => setTick(t => t + 1), intervalMs);
        return () => clearInterval(interval);
    }, [timeSpeed]); // Simplified: always run, frequency depends on speed.

    const [wasteMix, setWasteMix] = useState<WasteMix>({ dibRatio: 0.2, category: 'STANDARD' });
    const [locked, setLocked] = useState<Record<number, boolean>>({ 1: false, 2: false, 3: true });

    // History
    const [history, setHistory] = useState<DataPoint[]>(() => {
        const saved = localStorage.getItem('boilerHistory');
        return saved ? JSON.parse(saved) : [];
    });

    // Debounced History Saving to avoid freezing the main thread
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            localStorage.setItem('boilerHistory', JSON.stringify(history));
        }, 5000); // Save only after 5 seconds of inactivity or periodically if changing

        return () => clearTimeout(timeoutId);
    }, [history]);

    const [filterShutdowns, setFilterShutdowns] = useState(true);

    // 1. Instantaneous Calculation (Render phase)
    // Depends on current state. Re-runs when sliders move.
    const currentBarycenter = useMemo(() => calculateBarycenterWithWaste(
        zones.zone1, zones.zone2, zones.zone3,
        zones.subZone1, zones.subZone2, zones.subZone3,
        wasteMix.dibRatio
    ), [zones, wasteMix.dibRatio]);

    const fireStatus = useMemo(() => getFireStatus(currentBarycenter), [currentBarycenter]);

    // Simulation Snapshot (Instantaneous)
    const instantSimulation = useMemo(() => {
        const z1Flow = (zones.zone1 / 100) * totalPrimaryAirFlow;
        const z2Flow = (zones.zone2 / 100) * totalPrimaryAirFlow;
        const z3Flow = (zones.zone3 / 100) * totalPrimaryAirFlow;
        const apSumZones = z1Flow + z2Flow + z3Flow;

        return runSimulation({
            steamTarget,
            apSumZones,
            o2Real,
            mode: asMode,
            kap,
            grateSpeed,
            pusherSpeed,
            fireBarycenter: currentBarycenter,
            isUnstable,
            previousWasteDeposit: wasteDeposit,
            foulingFactor, // Pass fouling to engine
            dibRatio: wasteMix.dibRatio, // Pass mix ratio for PCI calc
            category: wasteMix.category // NEW: Pass category for enhanced physics
        });
    }, [steamTarget, zones, o2Real, asMode, kap, grateSpeed, pusherSpeed, isUnstable, currentBarycenter, wasteDeposit, totalPrimaryAirFlow, foulingFactor, wasteMix.dibRatio, wasteMix.category]);

    // Inertial Physics State (Thermal Lag)
    // We initialize with a "warm" boiler value to avoid cold-start jump
    const [realSH5, setRealSH5] = useState(625);

    // Effective Simulation Object (Exposed to UI)
    const simulation = useMemo(() => ({
        ...instantSimulation,
        sh5Temp: Math.round(realSH5) // Override with inertial temp
    }), [instantSimulation, realSH5]);

    // 2. Stateful Loop (Tick phase)
    // Updates the persistent state variables once per tick.
    // DANGER: Must not trigger recursive updates unless it's a new tick.
    useEffect(() => {
        // This runs only when 'tick' changes.
        // It consumes the 'simulation' result from the render that just happened.
        setWasteDeposit(instantSimulation.newWasteDeposit);
        // Increase fouling linearly (slowly): +0.01% per tick
        setFoulingFactor(f => Math.min(100, f + 0.005));

        // THERMAL INERTIA CALCULATION
        // Alpha determines the speed of change.
        // Higher alpha = faster response. For visible reaction, use 0.05-0.1 base.
        // We multiply by timeSpeed to adapt to acceleration.
        const alpha = Math.min(0.1 * timeSpeed, 1.0); // Cap at 1.0 for stability
        setRealSH5(prev => {
            const target = instantSimulation.sh5Temp;
            const delta = target - prev;
            // Always make some progress toward target
            if (Math.abs(delta) < 0.5) return target; // Snap if close
            return prev + (delta * alpha);
        });

        if (asMode !== 2) return;

        // PLC LOOPS
        const kpRef = 100;
        const kpError = instantSimulation.calculatedKp - kpRef; // Use instant physics for Control Loop (Sensors are fast)

        if (kpError > 15) {
            setPusherSpeed(prev => Math.max(0, prev - 0.5)); // Removed timeSpeed multiplier
        } else if (kpError < -15) {
            setPusherSpeed(prev => Math.min(100, prev + 0.1)); // Removed timeSpeed multiplier
        }

        if (Math.abs(kpError) < 20) {
            const errorO2 = 6.0 - instantSimulation.simulatedO2;
            const pusherGain = 0.05; // Removed timeSpeed multiplier
            if (Math.abs(errorO2) > 0.2) {
                setPusherSpeed(prev => Math.max(10, Math.min(90, prev - errorO2 * pusherGain)));
            }

            const zoneGain = 0.02; // Removed timeSpeed multiplier
            if (Math.abs(errorO2) > 0.5) {
                setZones(prev => {
                    let z2 = prev.zone2 + errorO2 * zoneGain;
                    z2 = Math.max(5, Math.min(60, z2));
                    let z3 = prev.zone3 - (z2 - prev.zone2);
                    z3 = Math.max(5, z3);
                    if (z3 <= 5) z2 = 100 - prev.zone1 - 5;
                    return { ...prev, zone2: z2, zone3: z3 };
                });
            }
        }

        // RECORD HISTORY
        // RECORD HISTORY
        setHistory(prev => {
            // Optimization: If speed is high (>10x), only record every Nth tick to prevent UI lag
            const recordFrequency = timeSpeed >= 30 ? 5 : timeSpeed >= 10 ? 2 : 1;

            if (tick % recordFrequency !== 0) return prev;

            const newPoint: DataPoint = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                sh5Temp: Math.round(realSH5), // Record inertial temp (Real world)
                o2Level: instantSimulation.simulatedO2, // O2 is fast
                steamFlow: steamTarget, // Approximate, SimulationResult doesn't have steamFlow currently
                zone1Flow: (zones.zone1 / 100) * totalPrimaryAirFlow,
                zone2Flow: (zones.zone2 / 100) * totalPrimaryAirFlow,
                zone3Flow: (zones.zone3 / 100) * totalPrimaryAirFlow,
                barycenter: currentBarycenter,
                isTechnicalStop: false
            };
            // Keep last 2000 points (~30 mins at 60x, or 33 hours at 1x)
            const newHistory = [...prev, newPoint];
            if (newHistory.length > 2000) return newHistory.slice(newHistory.length - 2000);
            return newHistory;
        });

    }, [tick, asMode, instantSimulation.sh5Temp]); // tick for timing, asMode to respond to mode changes, sh5Temp for thermal inertia

    const updateZone = (zoneId: 1 | 2 | 3, value: number) => {
        if (locked[zoneId]) return;
        const others = [1, 2, 3].filter(id => id !== zoneId) as (1 | 2 | 3)[];
        const [idA, idB] = others;
        let constrainedId = locked[idA] ? idA : locked[idB] ? idB : null;
        if (!constrainedId) constrainedId = idA;
        if (locked[idA] && locked[idB]) return;

        const fixedVal = zones[`zone${constrainedId!}`];
        let newValue = Math.min(value, 100 - fixedVal);
        newValue = Math.max(newValue, 0);
        const flexibleVal = 100 - fixedVal - newValue;
        const flexibleId = idA === constrainedId ? idB : idA;

        setZones(prev => ({
            ...prev,
            [`zone${zoneId}`]: newValue,
            [`zone${flexibleId}`]: flexibleVal
        }));
    };

    const updateSubZone = (zoneId: 1 | 2 | 3, value: number) => {
        setZones(prev => ({ ...prev, [`subZone${zoneId}`]: value }));
    };

    const handleFileUpload = async (file: File) => {
        try {
            const data = await parseCSVData(file);
            setHistory(data);
        } catch (error) {
            console.error("Failed to parse CSV", error);
            alert("Erreur lors de la lecture du fichier CSV");
        }
    };

    const handleSootBlowing = () => {
        setFoulingFactor(prev => Math.max(0, prev - 30)); // Reduce fouling by 30%
    };

    // Filtered history
    const filteredHistory = useMemo(() => {
        if (!filterShutdowns) return history;
        return history.filter(h => h.sh5Temp >= 500);
    }, [history, filterShutdowns]);

    return {
        zones, setZones, updateZone, updateSubZone,
        wasteMix, setWasteMix,
        locked, setLocked,
        steamTarget, setSteamTarget,
        o2Real, setO2Real,
        kap, setKap,
        asMode, setAsMode,
        grateSpeed, setGrateSpeed,
        pusherSpeed, setPusherSpeed,
        totalPrimaryAirFlow, setTotalPrimaryAirFlow,
        isUnstable, setIsUnstable,
        simulation, // Now Inertial
        currentBarycenter,
        fireStatus,
        history,
        filteredHistory,
        filterShutdowns, setFilterShutdowns,
        handleFileUpload,
        timeSpeed, setTimeSpeed,
        wasteDeposit,
        foulingFactor, handleSootBlowing
    };
};
