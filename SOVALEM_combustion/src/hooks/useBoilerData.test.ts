import { renderHook, act } from '@testing-library/react';
import { useBoilerData } from './useBoilerData';
import { describe, it, expect, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

describe('useBoilerData', () => {
    it('should initialize with default values', () => {
        const { result } = renderHook(() => useBoilerData());

        expect(result.current.zones.zone1).toBe(61);
        expect(result.current.wasteMix.dibRatio).toBe(0.2);
        expect(result.current.currentBarycenter).toBeGreaterThan(0);
    });

    it('should update zone values', () => {
        const { result } = renderHook(() => useBoilerData());

        act(() => {
            result.current.updateZone(1, 80);
        });

        expect(result.current.zones.zone1).toBe(80);
    });

    it('should calculate fire status correctly', () => {
        const { result } = renderHook(() => useBoilerData());
        const status = result.current.fireStatus;
        expect(status).toHaveProperty('status');
        expect(status).toHaveProperty('color');
    });

    it('should respect locking mechanism', () => {
        const { result } = renderHook(() => useBoilerData());

        act(() => {
            result.current.setLocked({ ...result.current.locked, 1: true });
        });

        act(() => {
            result.current.updateZone(1, 99);
        });

        // Should not update because it's locked
        expect(result.current.zones.zone1).not.toBe(99);
    });
});
