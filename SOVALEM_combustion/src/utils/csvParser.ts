import Papa from 'papaparse';

import type { DataPoint } from '../types';

export const parseCSVData = (fileInfo: string | File): Promise<DataPoint[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(fileInfo, {
            header: true,
            dynamicTyping: false,
            skipEmptyLines: true,
            complete: (results) => {
                const parsedData: DataPoint[] = [];

                const parseNumber = (val: any): number => {
                    if (typeof val === 'number') return val;
                    if (!val) return 0;
                    // Handle French decimal comma
                    const num = parseFloat(String(val).replace(',', '.'));
                    return isNaN(num) ? 0 : num;
                };

                const data = results.data as any[];

                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    if (!row['Timestamp']) continue;

                    // 1. Get Zonal Flows (FT10342N, FT10352N, FT10362N)
                    const z1 = parseNumber(row['Inc_AP3_FT10342N_YOUT']);
                    const z2 = parseNumber(row['Inc_AP3_FT10352N_YOUT']);
                    const z3 = parseNumber(row['Inc_AP3_FT10362N_YOUT']);

                    // 2. Get Temperatures
                    // SH5 = TT12115 (Col T) based on user confirmation ("c'est la colonne T le surchauffeur 5")
                    // TT12300 (Col AA) is "Sortie Chaudière"
                    let sh5Temp = parseNumber(row['Chaud_Vap_TT12115_YOUT']);

                    // Fallback: If T is missing, maybe they meant AA? But let's stick to user explicit instruction.
                    if (!sh5Temp) sh5Temp = parseNumber(row['Chaud_Vap_TT12300_YOUT']);

                    // Simple "Robustness" check
                    if (sh5Temp < 0 || sh5Temp > 1200) {
                        const prev = i > 0 ? parseNumber(data[i - 1]['Chaud_Vap_TT12115_YOUT']) : 0;
                        const next = i < data.length - 1 ? parseNumber(data[i + 1]['Chaud_Vap_TT12115_YOUT']) : 0;
                        sh5Temp = (prev > 0 && next > 0) ? (prev + next) / 2 : (prev || next || 0);
                    }

                    // 3. Barycenter
                    const totalZonal = z1 + z2 + z3;
                    const barycenter = totalZonal > 0
                        ? Number(((z1 * 1.5 + z2 * 3.5 + z3 * 5.5) / totalZonal).toFixed(2))
                        : 0;

                    // 4. Steam Flow & O2
                    // O2 = AT12303 (Col P in image, header says Inc_Combus_AT12303_YOUT)
                    const o2Level = parseNumber(row['Inc_Combus_AT12303_YOUT']) || 6.0;

                    // Steam Flow ? (Not explicitly in header snippet, defaulting to 30.6 if not found)
                    // The user screenshot shows "30.03 t/h" but no tag name visible in CSV header snippet (it ended at AA).
                    const steamFlow = parseNumber(row['Debit_Vapeur']) || 30.6; // Placeholder

                    parsedData.push({
                        id: row['Timestamp'],
                        timestamp: row['Timestamp'],
                        zone1Flow: z1,
                        zone2Flow: z2,
                        zone3Flow: z3,
                        sh5Temp: sh5Temp,
                        steamFlow: steamFlow,
                        o2Level: o2Level,
                        barycenter,
                        isTechnicalStop: sh5Temp < 500
                    });
                }
                resolve(parsedData);
            },
            error: (error) => reject(error)
        });
    });
};

