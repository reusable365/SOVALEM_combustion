import React from 'react';
import { X, BookOpen, Calculator } from 'lucide-react';
import { HELP_CONTENT } from '../data/helpContent';

interface Props {
    topicKey: string | null;
    onClose: () => void;
}

export const HelpModal: React.FC<Props> = ({ topicKey, onClose }) => {
    if (!topicKey) return null;

    const content = HELP_CONTENT[topicKey];
    if (!content) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
                            <BookOpen size={24} className="text-blue-300" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{content.title}</h2>
                            <p className="text-slate-300 text-sm mt-1">Guide Interactif du Jumeau Numérique</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="font-bold text-slate-800 mb-2">💡 Comprendre le Concept</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            {content.description}
                        </p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h3 className="font-bold text-blue-900 text-sm mb-3 flex items-center gap-2">
                            🔍 Détails & Astuces
                        </h3>
                        <ul className="space-y-2">
                            {content.details.map((detail, idx) => (
                                <li key={idx} className="text-blue-800 text-sm flex gap-2">
                                    <span className="text-blue-400">•</span>
                                    {detail}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {content.formula && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-600">
                            <div className="flex items-center gap-2 mb-2 text-slate-400 font-bold uppercase tracking-wider">
                                <Calculator size={12} /> Formule Simplifiée
                            </div>
                            {content.formula}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-semibold text-sm transition"
                    >
                        J'ai compris
                    </button>
                </div>
            </div>
        </div>
    );
};
