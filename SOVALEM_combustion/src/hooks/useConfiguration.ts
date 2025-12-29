import { useState, useEffect } from 'react';
import type { BoilerConfig, ZoneData, WasteMix } from '../types';

const STORAGE_KEY = 'boiler_configurations';

export const useConfiguration = () => {
    const [configs, setConfigs] = useState<BoilerConfig[]>([]);

    // Load configs from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setConfigs(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved configurations", e);
            }
        }
    }, []);

    const saveConfig = (name: string, zones: ZoneData, wasteMix: WasteMix, description?: string) => {
        const newConfig: BoilerConfig = {
            id: crypto.randomUUID(),
            name,
            description,
            timestamp: Date.now(),
            zones,
            wasteMix
        };

        const updatedConfigs = [...configs, newConfig];
        setConfigs(updatedConfigs);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfigs));
        return newConfig;
    };

    const deleteConfig = (id: string) => {
        const updatedConfigs = configs.filter(c => c.id !== id);
        setConfigs(updatedConfigs);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfigs));
    };

    const loadConfig = (id: string): BoilerConfig | undefined => {
        return configs.find(c => c.id === id);
    };

    return {
        configs,
        saveConfig,
        deleteConfig,
        loadConfig
    };
};
