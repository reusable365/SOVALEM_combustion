import React, { useState } from 'react';
import { Save, Trash2, RotateCcw, Plus } from 'lucide-react';
import { useConfiguration } from '../hooks/useConfiguration';
import type { ZoneData, WasteMix } from '../types';

interface Props {
    currentZones: ZoneData;
    currentWasteMix: WasteMix;
    onLoadConfig: (zones: ZoneData, wasteMix: WasteMix) => void;
}

export const ConfigurationPanel: React.FC<Props> = ({ currentZones, currentWasteMix, onLoadConfig }) => {
    const { configs, saveConfig, deleteConfig, loadConfig } = useConfiguration();
    const [newName, setNewName] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleSave = () => {
        if (!newName.trim()) return;
        saveConfig(newName, currentZones, currentWasteMix);
        setNewName('');
    };

    const handleLoad = (id: string) => {
        const config = loadConfig(id);
        if (config) {
            onLoadConfig(config.zones, config.wasteMix);
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mt-4">
            <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <Save size={18} />
                    Gestion des Configurations
                </h3>
                <span className="text-xs text-slate-400">{isOpen ? 'Masquer' : 'Afficher'}</span>
            </div>

            {isOpen && (
                <div className="space-y-4">
                    {/* Save New */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Nom de la configuration (ex: Test Faible Débit)"
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                            onClick={handleSave}
                            disabled={!newName.trim()}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Plus size={16} /> Sauvegarder
                        </button>
                    </div>

                    {/* List */}
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {configs.length === 0 && (
                            <p className="text-center text-slate-400 text-sm italic py-4">Aucune configuration sauvegardée.</p>
                        )}
                        {configs.map(config => (
                            <div key={config.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-indigo-200 transition">
                                <div>
                                    <div className="font-medium text-slate-700">{config.name}</div>
                                    <div className="text-xs text-slate-500">
                                        {new Date(config.timestamp).toLocaleString()}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleLoad(config.id)}
                                        className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                                        title="Charger cette configuration"
                                    >
                                        <RotateCcw size={16} />
                                    </button>
                                    <button
                                        onClick={() => deleteConfig(config.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
