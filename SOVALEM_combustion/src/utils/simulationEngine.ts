import type { WasteCategory } from '../types';
import { calculateDynamicPCI } from './combustionLogic';

export interface SimulationParams {
    steamTarget: number;
    apSumZones: number;
    o2Real: number;
    mode: 1 | 2;
    kap: number;
    grateSpeed: number;
    pusherSpeed: number;
    fireBarycenter: number;
    isUnstable: boolean;
    previousWasteDeposit: number;
    foulingFactor: number; // 0-100%
    dibRatio: number; // 0-1 (LEGACY - kept for compat if needed, but primary is category)
    category: WasteCategory; // NEW
}

export interface SimulationResult {
    simulatedO2: number;
    calculatedKp: number;
    newWasteDeposit: number;
    efficiencyAs: number;
    sh5Temp: number;
    isSafe: boolean;
    asFlow: number;
    totalAir: number;
    dynamicPCI: number;
    steamFlow: number; // NEW: Expose simulated steam flow
}

export const runSimulation = (params: SimulationParams): SimulationResult => {
    // 0. DYNAMIC PCI CALCULATION (Weighted Mixture)
    // We pass dibRatio as the "mixRatio" (User input slider)
    const dynamicPCI = calculateDynamicPCI(
        params.category,
        params.steamTarget,
        params.pusherSpeed,
        params.dibRatio
    );

    // Normalize PCI Factor for physics engine
    // Base reference is ~9200 kJ/kg for Factor 1.0
    // Range can now go from 0 (Inert) to 21000 (Plastics)
    // Factor range: 0.0 to ~2.3
    const pciFactor = dynamicPCI / 9000;

    // 1. WASTE DYNAMICS
    const inputMass = params.pusherSpeed * 1.0;
    const outputMass = params.grateSpeed * 1.0;
    const deltaStock = (inputMass - outputMass) * 0.02;
    const newWasteDeposit = Math.max(0, Math.min(100, params.previousWasteDeposit + deltaStock));

    // 2. SECONDARY AIR (AS) CALCULATION
    const totalAirTarget = params.steamTarget * 1330;
    let asFlow = 5000;
    if (params.mode === 2) {
        asFlow = Math.max(5000, totalAirTarget - params.apSumZones);
    } else {
        asFlow = Math.max(5000, params.steamTarget * 250); // Legacy mode 1 logic
    }

    const totalAirFlow = params.apSumZones + asFlow;
    const efficiencyAs = asFlow / totalAirFlow;

    // 3. STEAM GEN MODIFICATION
    // Make Steam Gen dependent on PCI (Heat Input)
    // Base: 30T/h at Factor 1.0 (Standard) with standard air.
    // HeatInput ~ (AirFlow * O2_consumed) * PCI_Efficiency
    // Simplified: BaseSteam * pciFactor * (AirFlow / BaseAir)
    const baseAir = 38000;
    const airRatio = totalAirFlow / baseAir;

    // Inert Waste produces NO steam (pciFactor ~ 0).
    const simulatedSteam = 30.0 * pciFactor * airRatio;

    // 4. KP & O2
    let calculatedKp = newWasteDeposit * 1.5;
    if (params.isUnstable) calculatedKp += (Math.random() - 0.5) * 5;

    // Base air factor relative to "Standard" operation
    const airFactor = totalAirFlow / 38000;

    // INERT WASTE SPECIAL HANDLING for O2
    // Inert waste doesn't consume O2, so O2 should rise significantly
    // Effective fuel is Mass * EnergyDensity(PCI)
    let effectiveFuelFactor = (newWasteDeposit / 50) * pciFactor;

    if (params.category === 'INERT' && params.dibRatio > 0.8) {
        effectiveFuelFactor = 0.1; // Very low consumption
    }

    let simulatedO2 = 6.0 + (airFactor - effectiveFuelFactor) * 5;
    simulatedO2 = Math.max(0.5, Math.min(20.5, simulatedO2));

    // 5. SH5 TEMP
    const baseTemp = 625;
    const posFactor = (params.fireBarycenter - 3.5) * 15;
    const loadFactor = (newWasteDeposit - 50) * 1;

    // PCI IMPACT BOOSTED
    // Previous multiplier was 50. Now we use 200 for dramatic effect.
    // At Factor 1.0 (Standard) -> Delta 0
    // At Factor 0.5 (Wet) -> -0.5 * 200 = -100°C drop
    // At Factor 2.0 (Plastic) -> +1.0 * 200 = +200°C rise
    let pciTempDelta = (pciFactor - 1.0) * 200;

    // Special damping for Inert
    if (params.category === 'INERT') {
        const inertRatio = params.dibRatio;
        // If 100% inert, drop massive temp. If 20% inert (80% standard), drop less.
        // Standard PCI Factor ~0.9. 
        // If Inert (0), Factor ~0. 
        // 0 - 1.0 = -1.0 -> -200°C. That's good.
        // But Inert absorbs heat too.
        pciTempDelta -= (inertRatio * 50); // Extra absorption
    }

    const foulingEffect = params.foulingFactor * 0.5;
    const coolingFactor = Math.max(0, simulatedO2 - 6) * 10;

    // AS Cooling
    const asNormalized = (asFlow - 5000) / 15000;
    const asCoolingEffect = asNormalized * 30;
    const modeCoolingBonus = params.mode === 2 ? efficiencyAs * 20 : 0;

    let sh5Temp = baseTemp + posFactor + loadFactor + foulingEffect + pciTempDelta
        - coolingFactor - asCoolingEffect - modeCoolingBonus;

    if (params.isUnstable) sh5Temp += (Math.random() - 0.5) * 10;

    const isSafe = sh5Temp < 620;

    return {
        simulatedO2: Number(simulatedO2.toFixed(1)),
        calculatedKp,
        newWasteDeposit,
        efficiencyAs,
        sh5Temp: Math.round(sh5Temp),
        isSafe,
        asFlow,
        totalAir: totalAirTarget,
        dynamicPCI,
        steamFlow: Number(simulatedSteam.toFixed(1))
    };
};
