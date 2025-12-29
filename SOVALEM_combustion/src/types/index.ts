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

// ============================================================
// ANOMALY DETECTION TYPES (Maintenance Prédictive)
// ============================================================

/**
 * Niveaux de risque du système
 */
export type RiskLevel = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';

/**
 * Types d'anomalies surveillées
 */
export type AnomalyType =
    | 'BARYCENTER_REAR'      // Feu trop en arrière (> 4.5)
    | 'O2_LOW'               // O2 trop bas (< 4%)
    | 'TEMP_SPIKE'           // Montée rapide de température (> 10°C/2min)
    | 'COMBUSTION_UNSTABLE'  // Combinaison de plusieurs anomalies
    | 'EXPLOSION_RISK';      // Signature d'explosion imminente

/**
 * Signature d'une anomalie détectée
 */
export interface AnomalySignature {
    type: AnomalyType;
    timestamp: string;
    value: number;
    threshold: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    action: string;
}

/**
 * État global des anomalies
 */
export interface AnomalyState {
    riskLevel: RiskLevel;
    activeAnomalies: AnomalySignature[];
    lastCheck: string;
    explosionRiskScore: number;  // 0-100, > 70 = CRITICAL
}

/**
 * Seuils de détection d'anomalies (calibrés sur l'incident du 20/12/2025)
 */
export const ANOMALY_THRESHOLDS = {
    BARYCENTER_MAX: 4.5,        // Au-delà = feu trop en arrière
    O2_MIN: 4.0,                // En dessous = risque imbrûlés gazeux
    TEMP_DELTA_MAX: 10,         // °C d'augmentation max sur 2 minutes
    TEMP_DELTA_WINDOW_MS: 120000, // 2 minutes en millisecondes
    RISK_SCORE_WARNING: 40,
    RISK_SCORE_CRITICAL: 70,
    RISK_SCORE_EMERGENCY: 90,
};

// Dummy export to prevent "module has no exports" issues in some environments
export const VERSION = "1.1.0";
