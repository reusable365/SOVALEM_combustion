import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { DataPoint, ZoneData, WasteMix } from '../types';
import { calculateBarycenterWithWaste, getFireStatus } from '../utils/combustionLogic';
import { runSimulation } from '../utils/simulationEngine';
import { parseCSVData } from '../utils/csvParser';

// Constants for performance optimization
const UI_REFRESH_INTERVAL_MS = 40; // 25 FPS cap for UI updates
const HISTORY_UPDATE_INTERVAL_MS = 1000; // Update history only once per second

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

    // ========================================================
    // PERFORMANCE OPTIMIZATION: Use refs for high-frequency updates
    // ========================================================

    // Internal tick counter (ref, no re-render)
    const tickRef = useRef(0);

    // Internal physics state (refs, no re-render on every tick)
    const physicsRef = useRef({
        realSH5: 625,
        wasteDeposit: 50,
        foulingFactor: 0,
        pusherSpeed: 50
    });

    // Last history update timestamp
    const lastHistoryUpdateRef = useRef(Date.now());

    // UI refresh trigger (only updates at 25 FPS)
    // UI tick counter removed - not needed for functionality

    const [wasteMix, setWasteMix] = useState<WasteMix>({ dibRatio: 0.2, category: 'STANDARD' });
    const [locked, setLocked] = useState<Record<number, boolean>>({ 1: false, 2: false, 3: true });

    // History - use ref for internal accumulation, state for UI
    const historyRef = useRef<DataPoint[]>([]);

    // Initialize historyRef from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('boilerHistory');
        if (saved) {
            try {
                historyRef.current = JSON.parse(saved);
            } catch {
                historyRef.current = [];
            }
        }
    }, []);
    const [history, setHistory] = useState<DataPoint[]>(() => {
        const saved = localStorage.getItem('boilerHistory');
        return saved ? JSON.parse(saved) : [];
    });

    // Debounced History Saving to avoid freezing the main thread
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            localStorage.setItem('boilerHistory', JSON.stringify(history));
        }, 5000);
        return () => clearTimeout(timeoutId);
    }, [history]);

    const [filterShutdowns, setFilterShutdowns] = useState(true);

    // ========================================================
    // 1. COMPUTATION (Pure calculation, no state updates)
    // ========================================================

    const currentBarycenter = useMemo(() => calculateBarycenterWithWaste(
        zones.zone1, zones.zone2, zones.zone3,
        zones.subZone1, zones.subZone2, zones.subZone3,
        wasteMix.dibRatio
    ), [zones, wasteMix.dibRatio]);

    const fireStatus = useMemo(() => getFireStatus(currentBarycenter), [currentBarycenter]);

    // Compute simulation result (used by physics loop)
    const computeInstantSimulation = useCallback(() => {
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
            pusherSpeed: physicsRef.current.pusherSpeed,
            fireBarycenter: currentBarycenter,
            isUnstable,
            previousWasteDeposit: physicsRef.current.wasteDeposit,
            foulingFactor: physicsRef.current.foulingFactor,
            dibRatio: wasteMix.dibRatio,
            category: wasteMix.category
        });
    }, [steamTarget, zones, o2Real, asMode, kap, grateSpeed, isUnstable, currentBarycenter, totalPrimaryAirFlow, wasteMix.dibRatio, wasteMix.category]);

    // Exposed simulation state (updated at UI refresh rate)
    const [simulationSnapshot, setSimulationSnapshot] = useState(() => ({
        ...computeInstantSimulation(),
        sh5Temp: 625
    }));

    // Alias for backward compatibility
    const simulation = simulationSnapshot;

    // ========================================================
    // 2. PHYSICS LOOP (High frequency, uses refs)
    // ========================================================

    useEffect(() => {
        // Physics runs at real simulation speed
        const intervalMs = Math.max(16, 1000 / timeSpeed); // Min 16ms (~60Hz max)

        const physicsLoop = setInterval(() => {
            tickRef.current += 1;

            const instantSim = computeInstantSimulation();

            // Update physics refs (no re-render)
            physicsRef.current.wasteDeposit = instantSim.newWasteDeposit;
            physicsRef.current.foulingFactor = Math.min(100, physicsRef.current.foulingFactor + 0.005);

            // Thermal inertia calculation
            const alpha = Math.min(0.1 * timeSpeed, 1.0);
            const target = instantSim.sh5Temp;
            const delta = target - physicsRef.current.realSH5;
            if (Math.abs(delta) < 0.5) {
                physicsRef.current.realSH5 = target;
            } else {
                physicsRef.current.realSH5 += delta * alpha;
            }

            // PLC regulation (Mode 2 only)
            if (asMode === 2) {
                const kpRef = 100;
                const kpError = instantSim.calculatedKp - kpRef;

                if (kpError > 15) {
                    physicsRef.current.pusherSpeed = Math.max(0, physicsRef.current.pusherSpeed - 0.5);
                } else if (kpError < -15) {
                    physicsRef.current.pusherSpeed = Math.min(100, physicsRef.current.pusherSpeed + 0.1);
                }

                if (Math.abs(kpError) < 20) {
                    const errorO2 = 6.0 - instantSim.simulatedO2;
                    const pusherGain = 0.05;
                    if (Math.abs(errorO2) > 0.2) {
                        physicsRef.current.pusherSpeed = Math.max(10, Math.min(90, physicsRef.current.pusherSpeed - errorO2 * pusherGain));
                    }

                    // Zone adjustment (requires state update, but throttled)
                    const zoneGain = 0.02;
                    if (Math.abs(errorO2) > 0.5 && tickRef.current % 10 === 0) {
                        setZones(prev => {
                            let z2 = prev.zone2 + errorO2 * zoneGain * 10; // Compensate for throttling
                            z2 = Math.max(5, Math.min(60, z2));
                            let z3 = prev.zone3 - (z2 - prev.zone2);
                            z3 = Math.max(5, z3);
                            if (z3 <= 5) z2 = 100 - prev.zone1 - 5;
                            return { ...prev, zone2: z2, zone3: z3 };
                        });
                    }
                }
            }

            // ========================================================
            // 3. HISTORY UPDATE (Once per second only)
            // ========================================================
            const now = Date.now();
            if (now - lastHistoryUpdateRef.current >= HISTORY_UPDATE_INTERVAL_MS) {
                lastHistoryUpdateRef.current = now;

                const newPoint: DataPoint = {
                    id: now.toString(),
                    timestamp: new Date().toISOString(),
                    sh5Temp: Math.round(physicsRef.current.realSH5),
                    o2Level: instantSim.simulatedO2,
                    steamFlow: steamTarget,
                    zone1Flow: (zones.zone1 / 100) * totalPrimaryAirFlow,
                    zone2Flow: (zones.zone2 / 100) * totalPrimaryAirFlow,
                    zone3Flow: (zones.zone3 / 100) * totalPrimaryAirFlow,
                    barycenter: currentBarycenter,
                    isTechnicalStop: false
                };

                // Update ref (no re-render)
                if (Array.isArray(historyRef.current)) {
                    historyRef.current = [...historyRef.current, newPoint];
                    if (historyRef.current.length > 2000) {
                        historyRef.current = historyRef.current.slice(-2000);
                    }
                } else {
                    historyRef.current = [newPoint];
                }
            }

        }, intervalMs);

        return () => clearInterval(physicsLoop);
    }, [timeSpeed, asMode, computeInstantSimulation, steamTarget, zones, totalPrimaryAirFlow, currentBarycenter]);

    // ========================================================
    // 4. UI REFRESH LOOP (Capped at 25 FPS)
    // ========================================================

    useEffect(() => {
        const uiLoop = setInterval(() => {
            // Sync refs to state for UI update
            setSimulationSnapshot(() => ({
                ...computeInstantSimulation(),
                sh5Temp: Math.round(physicsRef.current.realSH5)
            }));

            // Sync pusher speed from ref to state
            setPusherSpeed(physicsRef.current.pusherSpeed);

            // Sync fouling
            setFoulingFactor(physicsRef.current.foulingFactor);

            // Sync waste deposit
            setWasteDeposit(physicsRef.current.wasteDeposit);

            // Sync history from ref to state (for UI rendering)
            if (Array.isArray(historyRef.current)) {
                setHistory(historyRef.current);
            }

            // Removed setUiTick - not needed
        }, UI_REFRESH_INTERVAL_MS);

        return () => clearInterval(uiLoop);
    }, [computeInstantSimulation]);

    // ========================================================
    // USER ACTIONS
    // ========================================================

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
            historyRef.current = data;
            setHistory(data);
        } catch (error) {
            console.error("Failed to parse CSV", error);
            alert("Erreur lors de la lecture du fichier CSV");
        }
    };

    const handleSootBlowing = () => {
        physicsRef.current.foulingFactor = Math.max(0, physicsRef.current.foulingFactor - 30);
        setFoulingFactor(physicsRef.current.foulingFactor);
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
        simulation,
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
