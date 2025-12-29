/**
 * SOVALEM COMBUSTION LOGIC
 * ========================
 * Logique physique calibrée pour l'usine SOVALEM
 * 
 * Constantes physiques utilisées:
 * - Enthalpie vapeur: 2675 kJ/kg
 * - Masse volumique air: 0.00129 kg/Nm³ (à 20°C)
 * - O2 dans l'air: 21%
 */

import type { WasteCategory } from '../types';

// ============================================================
// CONSTANTES DE CALIBRATION
// ============================================================

export const ZONE_WEIGHTS = {
    ZONE_1: 1.5,  // Séchage (avant de grille)
    ZONE_2: 3.5,  // Combustion principale
    ZONE_3: 5.5,  // Burnout (arrière de grille)
};

// Poids précis par rouleau (Positions physiques: 1, 2, 3, 4, 5, 6)
export const ROLLER_WEIGHTS = [1, 2, 3, 4, 5, 6];

// Seuils de classification PCI (kJ/kg)
export const PCI_THRESHOLDS = {
    WET_MAX: 7000,      // En dessous = déchet humide
    STANDARD_MAX: 11000, // Entre WET_MAX et STANDARD_MAX = standard
    BOOST_MAX: 16000,    // Entre STANDARD_MAX et BOOST_MAX = boost
    // Au-dessus = high power
};

// Seuils de barycentre
export const BARYCENTER_THRESHOLDS = {
    FORWARD_RISK: 3.0,   // En dessous = feu trop en avant
    OPTIMAL_MIN: 3.0,    // Zone optimale MIN
    OPTIMAL_MAX: 4.2,    // Zone optimale MAX
    BACKWARD_RISK: 4.2,  // Au-dessus = feu trop en arrière
};

// Constantes physiques
export const PHYSICS = {
    STEAM_ENTHALPY: 2675,       // kJ/kg - Enthalpie de vaporisation
    AIR_DENSITY: 0.00129,       // kg/Nm³ à 20°C
    O2_IN_AIR: 21,              // % O2 dans l'air ambiant
    SMOOTHING_WINDOW: 5,        // Nombre de points pour moyenne mobile
};

// ============================================================
// BUFFERS POUR LISSAGE (Moving Average)
// ============================================================

// Buffers internes pour le lissage - stockent les N dernières valeurs
const pciBuffer: number[] = [];
const barycenterBuffer: number[] = [];

/**
 * FONCTION DE LISSAGE (Moving Average)
 * Calcule une moyenne mobile sur les N dernières valeurs
 * Stabilise l'affichage des indicateurs
 * 
 * @param buffer - Tableau contenant les valeurs historiques
 * @param newValue - Nouvelle valeur à ajouter
 * @param windowSize - Taille de la fenêtre de lissage
 * @returns Moyenne lissée
 */
const smoothValue = (buffer: number[], newValue: number, windowSize: number = PHYSICS.SMOOTHING_WINDOW): number => {
    // Ajouter la nouvelle valeur au buffer
    buffer.push(newValue);

    // Garder seulement les N dernières valeurs
    while (buffer.length > windowSize) {
        buffer.shift();
    }

    // Calculer la moyenne
    const sum = buffer.reduce((acc, val) => acc + val, 0);
    return sum / buffer.length;
};

/**
 * Réinitialise les buffers de lissage
 * À appeler lors d'un reset ou changement de mode
 */
export const resetSmoothingBuffers = (): void => {
    pciBuffer.length = 0;
    barycenterBuffer.length = 0;
};

// ============================================================
// CALCUL DES DÉBITS PAR ROULEAU
// ============================================================

/**
 * Calculates individual roller flows based on zones and sub-distribution
 * @param z1 Zone 1 Total Flow (Nm³/h)
 * @param z2 Zone 2 Total Flow (Nm³/h)
 * @param z3 Zone 3 Total Flow (Nm³/h)
 * @param sub1 Split % for R1 (0-100)
 * @param sub2 Split % for R3 (0-100)
 * @param sub3 Split % for R5 (0-100)
 */
export const calculateRollerFlows = (
    z1: number, z2: number, z3: number,
    sub1: number, sub2: number, sub3: number
): number[] => {
    const r1 = z1 * (sub1 / 100);
    const r2 = z1 * ((100 - sub1) / 100);
    const r3 = z2 * (sub2 / 100);
    const r4 = z2 * ((100 - sub2) / 100);
    const r5 = z3 * (sub3 / 100);
    const r6 = z3 * ((100 - sub3) / 100);

    return [r1, r2, r3, r4, r5, r6];
};

// ============================================================
// CALCUL DU BARYCENTRE
// ============================================================

/**
 * Calcule le Barycentre du Feu (position du front de flamme)
 * 
 * Formule: (Z1×1.5 + Z2×3.5 + Z3×5.5) / (Z1 + Z2 + Z3)
 * 
 * @returns Position du feu sur la grille (1.5 à 5.5)
 */
export const calculateBarycenter = (
    z1: number, z2: number, z3: number,
    _sub1: number = 50, _sub2: number = 50, _sub3: number = 50
): number => {
    const totalFlow = z1 + z2 + z3;

    if (totalFlow <= 0) return 3.5; // Valeur par défaut (centre)

    // Formule du barycentre avec les poids zones
    const weightedSum = (z1 * ZONE_WEIGHTS.ZONE_1) +
        (z2 * ZONE_WEIGHTS.ZONE_2) +
        (z3 * ZONE_WEIGHTS.ZONE_3);

    return Number((weightedSum / totalFlow).toFixed(2));
};

/**
 * Calcule le Barycentre LISSÉ (avec Moving Average)
 */
export const calculateSmoothedBarycenter = (
    z1: number, z2: number, z3: number,
    _sub1: number = 50, _sub2: number = 50, _sub3: number = 50
): number => {
    const rawBarycenter = calculateBarycenter(z1, z2, z3, _sub1, _sub2, _sub3);
    return Number(smoothValue(barycenterBuffer, rawBarycenter).toFixed(2));
};

/**
 * Calculates PCI influence coefficient based on waste mix
 * DIB (high PCI ~12000) → fast combustion → fire shifts FORWARD
 * OM (low PCI ~8500) → slow combustion → fire shifts BACKWARD
 */
export const calculatePCIInfluence = (dibRatio: number): number[] => {
    const pci = 8500 + (dibRatio * 3500);
    const pciNeutral = 10000;
    const shiftFactor = (pci - pciNeutral) / 2000;

    return ROLLER_WEIGHTS.map((weight, idx) => {
        const positionFactor = (idx - 2.5) / 2.5;
        const adjustment = 1 - (positionFactor * shiftFactor * 0.15);
        return weight * adjustment;
    });
};

/**
 * Calculates the "Fire Barycenter" accounting for waste mix influence
 */
export const calculateBarycenterWithWaste = (
    z1: number, z2: number, z3: number,
    sub1: number = 50, sub2: number = 50, sub3: number = 50,
    dibRatio: number = 0.5
): number => {
    const rollers = calculateRollerFlows(z1, z2, z3, sub1, sub2, sub3);
    const totalFlow = rollers.reduce((a, b) => a + b, 0);

    if (totalFlow === 0) return 3.5;

    const adjustedWeights = calculatePCIInfluence(dibRatio);

    const weightedSum = rollers.reduce((acc, flow, index) => {
        return acc + (flow * adjustedWeights[index]);
    }, 0);

    return Number((weightedSum / totalFlow).toFixed(2));
};

// ============================================================
// STATUT DU FEU (Fire Status)
// ============================================================

export interface FireStatusResult {
    status: string;
    color: string;
    risk: 'low' | 'medium' | 'high';
    advice: string;
}

/**
 * Détermine l'état du feu basé sur le barycentre
 * 
 * Seuils calibrés SOVALEM:
 * - < 3.0 : FEU EN AVANT (Risque imbrûlés)
 * - 3.0 - 4.2 : COMBUSTION OPTIMALE
 * - > 4.2 : FEU EN ARRIÈRE (Risque surchauffe SH5)
 */
export const getFireStatus = (barycenter: number): FireStatusResult => {
    if (barycenter === 0 || barycenter < 1) {
        return {
            status: "Hors Service",
            color: "text-slate-400",
            risk: 'low',
            advice: "Démarrage requis"
        };
    }

    if (barycenter < BARYCENTER_THRESHOLDS.FORWARD_RISK) {
        return {
            status: "Feu En Avant",
            color: "text-blue-600",
            risk: 'high',
            advice: "⚠️ Risque imbrûlés - Réduire débit Zone 1 ou accélérer grille"
        };
    }

    if (barycenter > BARYCENTER_THRESHOLDS.BACKWARD_RISK) {
        return {
            status: "Feu En Arrière",
            color: "text-red-600",
            risk: 'high',
            advice: "⚠️ Risque surchauffe SH5 - Augmenter débit Zone 1 ou ralentir grille"
        };
    }

    return {
        status: "Combustion Optimale",
        color: "text-green-600",
        risk: 'low',
        advice: "✓ Position idéale du front de flamme"
    };
};

// ============================================================
// CALCUL DU DÉBIT ZONAL TOTAL
// ============================================================

/**
 * Calculates the total sum of zonal flows (FT103x2 tags)
 * This is the "true" air participating in combustion
 */
export const calculateTotalZonalFlow = (z1: number, z2: number, z3: number): number => {
    return z1 + z2 + z3;
};

// ============================================================
// CATÉGORIES DE DÉCHETS
// ============================================================

export const WASTE_CATEGORIES: Record<WasteCategory, { label: string, pci: number, description: string }> = {
    WET: { label: 'Humide ("L\'Extincteur")', pci: 4000, description: 'Tontes, biodéchets (800-1200 kcal)' },
    STANDARD: { label: 'Standard ("Le Socle")', pci: 8500, description: 'OMR Classique (2000 kcal)' },
    BOOST: { label: 'Boost ("Le Turbo")', pci: 13000, description: 'DIB Sec, Bois (3000 kcal)' },
    HIGH_POWER: { label: 'Haut Pouvoir ("La Flamme")', pci: 21000, description: 'Plastiques, PEHD (5000 kcal)' },
    INERT: { label: 'Inerte ("Le Lest")', pci: 0, description: 'Gravats, Terre (0 kcal)' },
};

/**
 * Retourne le PCI de référence pour une catégorie
 */
export const getPCIForCategory = (category: WasteCategory): number => {
    return WASTE_CATEGORIES[category]?.pci ?? 8500;
};

/**
 * CLASSIFICATION AUTOMATIQUE PAR PCI
 * Détermine la catégorie de déchet basée sur le PCI calculé
 */
export const classifyWasteByPCI = (pci: number): WasteCategory => {
    if (pci <= 0) return 'INERT';
    if (pci < PCI_THRESHOLDS.WET_MAX) return 'WET';
    if (pci < PCI_THRESHOLDS.STANDARD_MAX) return 'STANDARD';
    if (pci < PCI_THRESHOLDS.BOOST_MAX) return 'BOOST';
    return 'HIGH_POWER';
};

/**
 * Retourne les informations complètes sur la catégorie détectée
 */
export const getWasteCategoryInfo = (pci: number): {
    category: WasteCategory;
    label: string;
    description: string;
    color: string;
} => {
    const category = classifyWasteByPCI(pci);
    const info = WASTE_CATEGORIES[category];

    const colors: Record<WasteCategory, string> = {
        WET: 'text-blue-500',
        STANDARD: 'text-green-500',
        BOOST: 'text-orange-500',
        HIGH_POWER: 'text-red-500',
        INERT: 'text-gray-500'
    };

    return {
        category,
        label: info.label,
        description: info.description,
        color: colors[category]
    };
};

// ============================================================
// CALCUL PCI DYNAMIQUE (Mixed Waste)
// ============================================================

/**
 * CALCUL PCI DYNAMIQUE V2 (5 Catégories)
 * Mix entre PCI de base et catégorie sélectionnée
 */
export const calculateDynamicPCI = (
    category: WasteCategory,
    steamFlow: number,
    pusherSpeed: number,
    mixRatio: number = 1.0
): number => {
    const basePCI = WASTE_CATEGORIES['STANDARD'].pci;
    const targetPCI = getPCIForCategory(category);

    let pciTheoretical = basePCI;
    if (category !== 'STANDARD') {
        pciTheoretical = (basePCI * (1 - mixRatio)) + (targetPCI * mixRatio);
    }

    if (category === 'INERT' && mixRatio === 1.0) return 0;

    const safePusher = Math.max(10, pusherSpeed);
    const currentYield = steamFlow / safePusher;
    const nominalYield = 30.6 / 50.0;
    const correctionFactor = currentYield / nominalYield;

    let pciFinal = pciTheoretical * correctionFactor;
    return Math.max(0, Math.min(25000, pciFinal));
};

// ============================================================
// ESTIMATEUR PCI VIRTUEL (Formule Calibrée SOVALEM)
// ============================================================

/**
 * ESTIMATEUR PCI VIRTUEL ("Météo du Four")
 * 
 * Formule calibrée basée sur le bilan énergétique:
 * estimatedPCI = (steamFlow × 2675) / (totalAirFlow × 0.00129 × (21 - o2Level) / 21)
 * 
 * Où:
 * - 2675 = Enthalpie de la vapeur (kJ/kg)
 * - 0.00129 = Masse volumique de l'air (kg/Nm³)
 * - 21 = % O2 dans l'air ambiant
 * - (21 - o2Level) = O2 consommé
 * 
 * @param steamFlow - Débit Vapeur (T/h)
 * @param totalAirFlow - Débit Air Total (Nm³/h) = Z1 + Z2 + Z3
 * @param o2Real - Teneur O2 sortant (%)
 * @returns PCI estimé en kJ/kg
 */
export const calculateEstimatedPCI = (
    steamFlow: number,
    totalAirFlow: number,
    o2Real: number
): number => {
    // Validations
    if (steamFlow <= 0 || totalAirFlow <= 0) return 9200; // Valeur par défaut

    // O2 consommé = O2 entrant (21%) - O2 sortant
    const o2Consumed = PHYSICS.O2_IN_AIR - Math.max(0, Math.min(21, o2Real));

    // Protection division par zéro
    if (o2Consumed <= 0.5) return 9200;

    // Formule SOVALEM calibrée
    // PCI = (Vapeur × Enthalpie) / (Air × Densité × (O2_consommé / O2_air))
    const steamMassFlow = steamFlow * 1000; // Conversion T/h → kg/h
    const airMassFlow = totalAirFlow * PHYSICS.AIR_DENSITY; // kg/h
    const o2Factor = o2Consumed / PHYSICS.O2_IN_AIR;

    const estimatedPCI = (steamMassFlow * PHYSICS.STEAM_ENTHALPY) / (airMassFlow * o2Factor);

    // Bornage réaliste (0 - 25000 kJ/kg)
    return Math.round(Math.max(0, Math.min(25000, estimatedPCI)));
};

/**
 * ESTIMATEUR PCI LISSÉ (avec Moving Average)
 * Retourne une valeur stabilisée pour l'affichage UI
 */
export const calculateSmoothedPCI = (
    steamFlow: number,
    totalAirFlow: number,
    o2Real: number
): number => {
    const rawPCI = calculateEstimatedPCI(steamFlow, totalAirFlow, o2Real);
    return Math.round(smoothValue(pciBuffer, rawPCI));
};

/**
 * VERSION SIMPLIFIÉE pour affichage
 * Retourne le PCI avec informations de contexte
 */
export const getPCIWithContext = (
    steamFlow: number,
    totalAirFlow: number,
    o2Real: number,
    smoothed: boolean = true
): {
    value: number;
    category: WasteCategory;
    label: string;
    color: string;
    trend: 'stable' | 'rising' | 'falling';
} => {
    const pci = smoothed
        ? calculateSmoothedPCI(steamFlow, totalAirFlow, o2Real)
        : calculateEstimatedPCI(steamFlow, totalAirFlow, o2Real);

    const categoryInfo = getWasteCategoryInfo(pci);

    // Calcul tendance (basé sur le buffer)
    let trend: 'stable' | 'rising' | 'falling' = 'stable';
    if (pciBuffer.length >= 3) {
        const recent = pciBuffer.slice(-3);
        const diff = recent[2] - recent[0];
        if (diff > 200) trend = 'rising';
        else if (diff < -200) trend = 'falling';
    }

    return {
        value: pci,
        category: categoryInfo.category,
        label: categoryInfo.label,
        color: categoryInfo.color,
        trend
    };
};
