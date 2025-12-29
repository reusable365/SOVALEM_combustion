export interface ZoneData {
    // Sliders Principaux (Débits)
    zone1: number;
    zone2: number;
    zone3: number;

    // Sliders Secondaires (Répartition Rouleaux)
    // subZoneX représente le % du premier rouleau de la paire.
    // Ex: subZone1 = 40 => R1 prend 40% de Z1, R2 prend 60% de Z1.
    subZone1: number;
    subZone2: number;
    subZone3: number;
}

export type WasteCategory = 'WET' | 'STANDARD' | 'BOOST' | 'HIGH_POWER' | 'INERT';

export interface WasteMix {
    dibRatio: number; // 0.0 (OM) à 1.0 (DIB pur) - Gardé pour compatibilité
    category: WasteCategory; // Nouvelle classification
    pciEstimate?: number; // Optionnel
}

export interface DataPoint {
    id: string;
    timestamp: string;

    // Débits Zones
    zone1Flow: number;
    zone2Flow: number;
    zone3Flow: number;

    // Débits Rouleaux (Calculés ou Mesurés)
    rollersFlow?: number[]; // [R1, R2, R3, R4, R5, R6]

    sh5Temp: number;
    steamFlow: number;
    o2Level: number;
    barycenter: number;
    isTechnicalStop?: boolean; // If SH5 < 500
    wasteMixRatio?: number; // Snapshot du ratio au moment de la mesure
}

export interface BoilerState {
    zones: ZoneData;
    wasteMix: WasteMix;
    history: DataPoint[];
    isLocked: { [key: number]: boolean };
}

export interface BoilerConfig {
    id: string;
    name: string;
    description?: string;
    timestamp: number;
    zones: ZoneData;
    wasteMix: WasteMix;
}

// Dummy export to prevent "module has no exports" issues in some environments
export const VERSION = "1.0.0";
