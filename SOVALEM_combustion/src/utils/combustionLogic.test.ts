import { describe, it, expect } from 'vitest';
import {
    calculateRollerFlows,
    calculateBarycenter,
    calculatePCIInfluence,
    getFireStatus
} from './combustionLogic';

describe('combustionLogic', () => {
    describe('calculateRollerFlows', () => {
        it('should correctly split flows based on sub-zone percentages', () => {
            const z1 = 100, z2 = 100, z3 = 100;
            const sub1 = 50, sub2 = 50, sub3 = 50;
            const result = calculateRollerFlows(z1, z2, z3, sub1, sub2, sub3);

            expect(result).toEqual([50, 50, 50, 50, 50, 50]);
        });

        it('should handle 0% and 100% splits', () => {
            const z1 = 100, z2 = 100, z3 = 100;
            const sub1 = 0, sub2 = 100, sub3 = 50;
            const result = calculateRollerFlows(z1, z2, z3, sub1, sub2, sub3);

            // R1=0, R2=100 (sub1=0)
            // R3=100, R4=0 (sub2=100)
            // R5=50, R6=50 (sub3=50)
            expect(result).toEqual([0, 100, 100, 0, 50, 50]);
        });
    });

    describe('calculateBarycenter', () => {
        it('should return 0 when total flow is 0', () => {
            expect(calculateBarycenter(0, 0, 0)).toBe(0);
        });

        it('should calculate correct barycenter for balanced flows', () => {
            // Weights: [1, 2, 3, 4, 5, 6]
            // Flow: [10, 10, 10, 10, 10, 10]
            // (1*10 + 2*10 ... 6*10) / 60 = 210 / 60 = 3.5
            const result = calculateBarycenter(20, 20, 20, 50, 50, 50);
            expect(result).toBe(3.5);
        });
    });

    describe('calculatePCIInfluence', () => {
        it('should return default weights for neutral dibRatio (approx)', () => {
            // Neutral PCI is 10000. 
            // OM=8500, DIB=12000. 
            // dibRatio=? for 10000.
            // 8500 + x*3500 = 10000 => 3500x = 1500 => x = 0.428

            const neutralRatio = (10000 - 8500) / 3500;
            const weights = calculatePCIInfluence(neutralRatio);
            // Should be very close to original weights [1, 2, 3, 4, 5, 6]
            // Allow small float error
            expect(weights[0]).toBeCloseTo(1, 1);
            expect(weights[5]).toBeCloseTo(6, 1);
        });

        it('should reduce rear roller weights for high PCI (Pure DIB)', () => {
            const weights = calculatePCIInfluence(1.0); // High PCI
            // Fore rollers (index 0, 1, 2) should be relatively higher or less reduced?
            // "High PCI (DIB): reduce rear roller weights → fire moves forward"
            // Wait, logic says: 
            // shiftFactor positive.
            // positionFactor: -1 to +1.
            // adjustment = 1 - (pos * shift * 0.15)
            // If pos > 0 (rear) and shift > 0 (high PCI), adjustment < 1. Weights reduced. Correct.
            expect(weights[5]).toBeLessThan(6);
        });
    });

    describe('getFireStatus', () => {
        it('should identify optimal range', () => {
            expect(getFireStatus(2.5).status).toContain('Optimal');
            expect(getFireStatus(3.0).status).toContain('Optimal');
        });

        it('should identify drying zone (Avant)', () => {
            expect(getFireStatus(1.5).status).toContain('Feu Avant');
        });

        it('should identify burnout zone (Arrière)', () => {
            expect(getFireStatus(4.0).status).toContain('Feu Arrière');
        });
    });
});
