
export const ZONE_WEIGHTS = {
    ZONE_1: 1.5,
    ZONE_2: 3.5,
    ZONE_3: 5.5,
};

// Poids précis par rouleau (Positions physiques approx: 1, 2, 3, 4, 5, 6)
export const ROLLER_WEIGHTS = [1, 2, 3, 4, 5, 6];

/**
 * Calculates individual roller flows based on zones and sub-distribution
 * @param z1 Zone 1 Total Flow
 * @param z2 Zone 2 Total Flow
 * @param z3 Zone 3 Total Flow
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

/**
 * Calculates the "Fire Barycenter" based on 6 rollers.
 */
export const calculateBarycenter = (
    z1: number, z2: number, z3: number,
    sub1: number = 50, sub2: number = 50, sub3: number = 50
): number => {
    const rollers = calculateRollerFlows(z1, z2, z3, sub1, sub2, sub3);
    const totalFlow = rollers.reduce((a, b) => a + b, 0);

    if (totalFlow === 0) return 0;

    const weightedSum = rollers.reduce((acc, flow, index) => {
        return acc + (flow * ROLLER_WEIGHTS[index]);
    }, 0);

    return Number((weightedSum / totalFlow).toFixed(2));
};

/**
 * Calculates PCI influence coefficient based on waste mix
 * DIB (high PCI ~12000) → fast combustion → fire shifts FORWARD (coefficient < 1 on rear zones)
 * OM (low PCI ~8500) → slow combustion → fire shifts BACKWARD (coefficient > 1 on rear zones)
 * @param dibRatio 0 (pure OM) to 1 (pure DIB)
 * @returns coefficient to adjust roller weights
 */
export const calculatePCIInfluence = (dibRatio: number): number[] => {
    // Estimate PCI: linear interpolation between OM (8500) and DIB (12000)
    const pci = 8500 + (dibRatio * 3500);

    // Reference PCI (neutral point) = 10000 kJ/kg
    const pciNeutral = 10000;

    // Calculate shift factor: negative = backward shift, positive = forward shift
    const shiftFactor = (pci - pciNeutral) / 2000; // Range: -0.75 (pure OM) to +1.0 (pure DIB)

    // Apply progressive weight adjustments to rollers
    // High PCI (DIB): reduce rear roller weights → fire moves forward
    // Low PCI (OM): increase rear roller weights → fire moves backward
    return ROLLER_WEIGHTS.map((weight, idx) => {
        const positionFactor = (idx - 2.5) / 2.5; // -1 (R1) to +1 (R6)
        const adjustment = 1 - (positionFactor * shiftFactor * 0.15); // Max ±15% adjustment
        return weight * adjustment;
    });
};

/**
 * Calculates the "Fire Barycenter" accounting for waste mix influence
 * @param dibRatio waste mix ratio (0 = pure OM, 1 = pure DIB)
 */
export const calculateBarycenterWithWaste = (
    z1: number, z2: number, z3: number,
    sub1: number = 50, sub2: number = 50, sub3: number = 50,
    dibRatio: number = 0.5
): number => {
    const rollers = calculateRollerFlows(z1, z2, z3, sub1, sub2, sub3);
    const totalFlow = rollers.reduce((a, b) => a + b, 0);

    if (totalFlow === 0) return 0;

    // Get adjusted weights based on PCI
    const adjustedWeights = calculatePCIInfluence(dibRatio);

    const weightedSum = rollers.reduce((acc, flow, index) => {
        return acc + (flow * adjustedWeights[index]);
    }, 0);

    return Number((weightedSum / totalFlow).toFixed(2));
};

/**
 * Determines the fire position status based on barycenter
 */
export const getFireStatus = (barycenter: number): { status: string; color: string } => {
    if (barycenter === 0) return { status: "Hors Service", color: "text-slate-400" };
    if (barycenter < 2.0) return { status: "Feu Avant (Séchage)", color: "text-blue-600" };
    if (barycenter > 3.5) return { status: "Feu Arrière (Risque SH5)", color: "text-red-600" };
    return { status: "Centré (Optimal)", color: "text-green-600" };
};

/**
 * Calculates the total sum of zonal flows using FT103x2 tags.
 * This is the "true" air participating in combustion (ignoring pit ventilation leakage).
 */
export const calculateTotalZonalFlow = (z1: number, z2: number, z3: number): number => {
    return z1 + z2 + z3;
};

/**
 * ESTIMATEUR PCI VIRTUEL ("Météo du Four")
 * Estime le PCI (Pouvoir Calorifique Inférieur) en kJ/kg
 * en se basant sur la relation Vapeur Produite / Oxygène Consommé.
 * 
 * Principe :
 * - Si on consomme peu d'O2 (peu d'air) pour faire beaucoup de vapeur -> Le déchet est très énergétique (Sec/Plastique).
 * - Si on consomme beaucoup d'O2 pour faire peu de vapeur -> Le déchet est pauvre (Humide/Organique).
 * 
 * @param steamFlow Débit Vapeur (T/h)
 * @param totalAirFlow Débit Air Total Comburant (Nm3/h) = AP + AS
 * @param o2Real Teneur O2 sortant (%)
 */

import type { WasteCategory } from '../types';

export const WASTE_CATEGORIES: Record<WasteCategory, { label: string, pci: number, description: string }> = {
    WET: { label: 'Humide ("L\'Extincteur")', pci: 4000, description: 'Tontes, biodéchets (800-1200 kcal)' },
    STANDARD: { label: 'Standard ("Le Socle")', pci: 8500, description: 'OMR Classique (2000 kcal)' },
    BOOST: { label: 'Boost ("Le Turbo")', pci: 13000, description: 'DIB Sec, Bois (3000 kcal)' },
    HIGH_POWER: { label: 'Haut Pouvoir ("La Flamme")', pci: 21000, description: 'Plastiques, PEHD (5000 kcal)' },
    INERT: { label: 'Inerte ("Le Lest")', pci: 0, description: 'Gravats, Terre (0 kcal)' },
};

/**
 * CONSULTATION DU PCI SPECIFIQUE
 */
export const getPCIForCategory = (category: WasteCategory): number => {
    return WASTE_CATEGORIES[category]?.pci ?? 8500;
};

/**
 * CALCUL PCI DYNAMIQUE V2 (5 Catégories)
 * Prend en compte :
 * 1. La catégorie déclarée par le pontier (Extincteur -> Flamme)
 * 2. La réalité du terrain : Vapeur produite vs Intrants (Poussoir)
 * 
 * Formule : PCI_Réel = PCI_Base_Catégorie * (Ratio_Vapeur_Poussoir_Réel / Ratio_Reference)
 */
export const calculateDynamicPCI = (
    category: WasteCategory,  // CATEGORIE (Type d'ajout)
    steamFlow: number,        // T/h
    pusherSpeed: number,      // %
    mixRatio: number = 1.0    // % du mélange (Curseur DIB Ratio)
): number => {
    // 1. PCI Théorique (Mécanique de Mélange / Cocktail)
    // Base toujours présente : STANDARD (OMR)
    // Ajout : La catégorie sélectionnée
    const basePCI = WASTE_CATEGORIES['STANDARD'].pci; // 8500
    const targetPCI = getPCIForCategory(category);

    // Si la catégorie est STANDARD, le ratio n'a pas d'effet (100% standard reste standard)
    // Sinon, on mixe : (1 - ratio) * Base + ratio * Target
    let pciTheoretical = basePCI;

    if (category !== 'STANDARD') {
        pciTheoretical = (basePCI * (1 - mixRatio)) + (targetPCI * mixRatio);
    }

    // Cas spécial INERTE : il "dilue" le PCI.
    // 20% Inerte + 80% Standard = 0.2*0 + 0.8*8500 = 6800. Correct.

    // 2. Facteur de Correction "Réalité"
    const safePusher = Math.max(10, pusherSpeed);
    const currentYield = steamFlow / safePusher;
    const nominalYield = 30.6 / 50.0;
    const correctionFactor = currentYield / nominalYield;

    // 3. PCI Calculé
    // Si INERTE Pur (100%), PCI = 0.
    if (category === 'INERT' && mixRatio === 1.0) return 0;

    let pciFinal = pciTheoretical * correctionFactor;

    return Math.max(0, Math.min(25000, pciFinal));
};

export const calculateEstimatedPCI = (steamFlow: number, totalAirFlow: number, o2Real: number): number => {
    if (steamFlow <= 0 || totalAirFlow <= 0) return 9200;

    // Relation simplifiée : PCI = f(Vapeur / AirConsommé)
    // Plus je fais de vapeur avec peu d'air consommé, plus le PCI est haut.
    const oxygenConsumedFactor = Math.max(0.5, (21 - o2Real)); // Min 0.5 pour éviter division par 0

    // Ratio T_Vapeur / (Nm3_Air * %O2_conso)
    const performanceRatio = (steamFlow * 1000) / (totalAirFlow * oxygenConsumedFactor);

    // Calibration (Empirique)
    // Standard: 30T/h, 38000 Nm3/h (Total), 10% O2 (11% conso)
    // Ratio = 30000 / (38000 * 11) = 30000 / 418000 = 0.071
    // Ajustement V3 : On baisse légèrement le ratio de référence (0.065) pour ne pas être trop sévère.
    const baseRatio = 0.065;

    let estimatedPCI = 8500 * (performanceRatio / baseRatio);

    // Bornage large pour l'affichage
    return Math.round(Math.max(0, Math.min(25000, estimatedPCI)));
};
