import Papa from 'papaparse';

import type { DataPoint } from '../types';

/**
 * PCVUE DATA CLEANER
 * Nettoie les valeurs exportées par PCVue qui ont ce format:
 * - Guillemets autour des nombres: "5822,113"
 * - Virgule française comme séparateur décimal: 6,544
 * 
 * @param val - La valeur brute du CSV (peut être string, number, null, undefined)
 * @returns Le nombre nettoyé, ou 0 si invalide
 */
export const cleanPCVueValue = (val: unknown): number => {
    // Si c'est déjà un nombre valide, le retourner directement
    if (typeof val === 'number' && !isNaN(val)) return val;

    // Si null, undefined, ou chaîne vide, retourner 0
    if (val === null || val === undefined || val === '') return 0;

    // Convertir en string pour le traitement
    let strVal = String(val);

    // 1. Retirer les guillemets (PCVue entoure parfois les nombres de guillemets)
    strVal = strVal.replace(/^["']|["']$/g, '');

    // 2. Remplacer la virgule française par un point décimal
    // Attention: ne remplacer que si c'est bien un séparateur décimal (pas un séparateur de milliers)
    // Format PCVue typique: "5822,113" -> le dernier groupe après virgule a 1-3 chiffres = décimal
    strVal = strVal.replace(',', '.');

    // 3. Convertir en nombre
    const num = parseFloat(strVal);

    // 4. Retourner 0 si le résultat n'est pas un nombre valide
    return isNaN(num) ? 0 : num;
};

/**
 * MAPPING PCVUE -> SIMULATEUR SOVALEM
 * 
 * Tags PCVue (colonnes CSV)          -> Propriétés DataPoint
 * -----------------------------------|---------------------
 * Inc_AP3_FT10342N_YOUT              -> zone1Flow (Nm³/h)
 * Inc_AP3_FT10352N_YOUT              -> zone2Flow (Nm³/h)
 * Inc_AP3_FT10362N_YOUT              -> zone3Flow (Nm³/h)
 * Inc_Combus_AT12303_YOUT            -> o2Level (%)
 * Chaud_Vap_TT12115_YOUT             -> sh5Temp (°C) - Surchauffeur 5
 * Chaud_Vap_TT12300_YOUT             -> (fallback sh5Temp) - Sortie Chaudière
 * Chaud_Vap_FT12048C_YOUT            -> steamFlow (T/h) - ATTENTION: PCVue en kg/h, diviser par 1000!
 * Debit_Vapeur                       -> steamFlow (T/h) - Format alternatif
 */

// Colonnes PCVue connues
const PCVUE_COLUMNS = {
    // Débits zones (Air Primaire)
    ZONE1_FLOW: 'Inc_AP3_FT10342N_YOUT',
    ZONE2_FLOW: 'Inc_AP3_FT10352N_YOUT',
    ZONE3_FLOW: 'Inc_AP3_FT10362N_YOUT',

    // Oxygène
    O2_LEVEL: 'Inc_Combus_AT12303_YOUT',

    // Températures
    SH5_TEMP: 'Chaud_Vap_TT12115_YOUT',      // Surchauffeur 5 (principal)
    BOILER_OUT_TEMP: 'Chaud_Vap_TT12300_YOUT', // Sortie Chaudière (fallback)

    // Débit vapeur
    STEAM_FLOW_KGH: 'Chaud_Vap_FT12048C_YOUT', // En kg/h (à diviser par 1000)
    STEAM_FLOW_TH: 'Debit_Vapeur',             // Format alternatif en T/h

    // Timestamp
    TIMESTAMP: 'Timestamp'
};

/**
 * Calcule le barycentre du feu à partir des débits zonaux
 * Formule: (Z1×1.5 + Z2×3.5 + Z3×5.5) / (Z1 + Z2 + Z3)
 */
const calculateBarycenter = (z1: number, z2: number, z3: number): number => {
    const total = z1 + z2 + z3;
    if (total <= 0) return 3.5; // Valeur par défaut (centre)
    return Number(((z1 * 1.5 + z2 * 3.5 + z3 * 5.5) / total).toFixed(2));
};

/**
 * Génère un ID unique basé sur le timestamp et un index
 */
const generateUniqueId = (timestamp: string, index: number): string => {
    // Essayer de parser le timestamp, sinon utiliser Date.now()
    const baseTime = Date.parse(timestamp) || Date.now();
    return `${baseTime}-${index}`;
};

/**
 * PARSER CSV PRINCIPAL
 * Parse les fichiers CSV exportés de PCVue et les convertit en DataPoint[]
 * 
 * @param fileInfo - Chemin du fichier ou objet File
 * @returns Promise<DataPoint[]> - Tableau de points de données typés
 */
export const parseCSVData = (fileInfo: string | File): Promise<DataPoint[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(fileInfo, {
            header: true,
            dynamicTyping: false, // On gère le typage nous-mêmes avec cleanPCVueValue
            skipEmptyLines: true,
            complete: (results) => {
                const parsedData: DataPoint[] = [];
                const data = results.data as Record<string, unknown>[];

                // Log des colonnes trouvées pour debug
                if (data.length > 0) {
                    console.log('[csvParser] Colonnes détectées:', Object.keys(data[0]));
                }

                for (let i = 0; i < data.length; i++) {
                    const row = data[i];

                    // Vérifier qu'on a un timestamp valide
                    const timestamp = row[PCVUE_COLUMNS.TIMESTAMP] as string;
                    if (!timestamp) continue;

                    // ========================================
                    // 1. DÉBITS ZONAUX (Nm³/h)
                    // ========================================
                    const zone1Flow = cleanPCVueValue(row[PCVUE_COLUMNS.ZONE1_FLOW]);
                    const zone2Flow = cleanPCVueValue(row[PCVUE_COLUMNS.ZONE2_FLOW]);
                    const zone3Flow = cleanPCVueValue(row[PCVUE_COLUMNS.ZONE3_FLOW]);

                    // ========================================
                    // 2. TEMPÉRATURE SURCHAUFFEUR 5 (°C)
                    // ========================================
                    let sh5Temp = cleanPCVueValue(row[PCVUE_COLUMNS.SH5_TEMP]);

                    // Fallback: Utiliser la sortie chaudière si SH5 manquant
                    if (sh5Temp === 0) {
                        sh5Temp = cleanPCVueValue(row[PCVUE_COLUMNS.BOILER_OUT_TEMP]);
                    }

                    // Validation: Température doit être entre 0 et 1200°C
                    if (sh5Temp < 0 || sh5Temp > 1200) {
                        // Interpolation avec les points adjacents
                        const prevRow = i > 0 ? data[i - 1] : null;
                        const nextRow = i < data.length - 1 ? data[i + 1] : null;
                        const prevTemp = prevRow ? cleanPCVueValue(prevRow[PCVUE_COLUMNS.SH5_TEMP]) : 0;
                        const nextTemp = nextRow ? cleanPCVueValue(nextRow[PCVUE_COLUMNS.SH5_TEMP]) : 0;

                        if (prevTemp > 0 && nextTemp > 0) {
                            sh5Temp = (prevTemp + nextTemp) / 2;
                        } else {
                            sh5Temp = prevTemp || nextTemp || 625; // Valeur par défaut typique
                        }
                    }

                    // ========================================
                    // 3. NIVEAU O2 (%)
                    // ========================================
                    const o2Level = cleanPCVueValue(row[PCVUE_COLUMNS.O2_LEVEL]) || 6.0;

                    // ========================================
                    // 4. DÉBIT VAPEUR (T/h)
                    // PCVue exporte en kg/h (ex: 30452,22)
                    // Le simulateur attend des T/h (ex: 30,4)
                    // ========================================
                    let steamFlow = 0;

                    // Essayer d'abord le tag principal (en kg/h, à diviser par 1000)
                    const steamFlowKgH = cleanPCVueValue(row[PCVUE_COLUMNS.STEAM_FLOW_KGH]);
                    if (steamFlowKgH > 0) {
                        // Si valeur > 1000, c'est probablement en kg/h
                        steamFlow = steamFlowKgH > 1000 ? steamFlowKgH / 1000 : steamFlowKgH;
                    }

                    // Fallback: essayer le format alternatif (déjà en T/h)
                    if (steamFlow === 0) {
                        steamFlow = cleanPCVueValue(row[PCVUE_COLUMNS.STEAM_FLOW_TH]) || 30.6;
                    }

                    // ========================================
                    // 5. BARYCENTRE DU FEU
                    // Calculé à partir des débits zonaux
                    // ========================================
                    const barycenter = calculateBarycenter(zone1Flow, zone2Flow, zone3Flow);

                    // ========================================
                    // 6. CONSTRUCTION DU DATAPOINT
                    // ========================================
                    parsedData.push({
                        id: generateUniqueId(timestamp, i),
                        timestamp: timestamp,
                        zone1Flow,
                        zone2Flow,
                        zone3Flow,
                        sh5Temp,
                        steamFlow,
                        o2Level,
                        barycenter,
                        isTechnicalStop: sh5Temp < 500 // Arrêt technique si température basse
                    });
                }

                console.log(`[csvParser] ${parsedData.length} points de données importés avec succès`);
                resolve(parsedData);
            },
            error: (error) => {
                console.error('[csvParser] Erreur de parsing:', error);
                reject(error);
            }
        });
    });
};
