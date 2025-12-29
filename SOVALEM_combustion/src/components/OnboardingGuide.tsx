/**
 * Onboarding Guide Component
 * Welcome modal and tour for new users
 */

import { useState, useEffect } from 'react';
import {
    X,
    Flame,
    Sliders,
    BarChart3,
    Bot,
    Play,
    ChevronRight,
    ChevronLeft,
    Sparkles
} from 'lucide-react';

interface OnboardingGuideProps {
    onClose: () => void;
}

const STEPS = [
    {
        title: "Bienvenue sur SOVALEM Simulator !",
        icon: Flame,
        color: "from-orange-500 to-red-600",
        content: (
            <>
                <p className="text-slate-300 mb-4">
                    Ce simulateur vous permet de comprendre et optimiser la combustion
                    de l'unité de valorisation énergétique.
                </p>
                <p className="text-slate-400 text-sm">
                    Suivez ce guide rapide pour découvrir les principales fonctionnalités.
                </p>
            </>
        )
    },
    {
        title: "Contrôle des Airs",
        icon: Sliders,
        color: "from-blue-500 to-cyan-500",
        content: (
            <>
                <p className="text-slate-300 mb-4">
                    Ajustez la répartition de l'air primaire entre les 6 zones du four
                    pour optimiser la combustion.
                </p>
                <ul className="text-slate-400 text-sm space-y-2">
                    <li>• <strong>Zones 1-2</strong> : Séchage des déchets</li>
                    <li>• <strong>Zones 3-4</strong> : Combustion principale</li>
                    <li>• <strong>Zones 5-6</strong> : Fin de combustion, mâchefers</li>
                </ul>
            </>
        )
    },
    {
        title: "Indicateurs en Temps Réel",
        icon: BarChart3,
        color: "from-emerald-500 to-green-500",
        content: (
            <>
                <p className="text-slate-300 mb-4">
                    Surveillez les paramètres clés de la combustion :
                </p>
                <ul className="text-slate-400 text-sm space-y-2">
                    <li>• <strong>SH5</strong> : Température surchauffeur (objectif : 380°C)</li>
                    <li>• <strong>O₂</strong> : Taux d'oxygène (objectif : 6-8%)</li>
                    <li>• <strong>Barycentre</strong> : Position du feu dans le four</li>
                </ul>
            </>
        )
    },
    {
        title: "Mentor IA",
        icon: Bot,
        color: "from-purple-500 to-indigo-500",
        content: (
            <>
                <p className="text-slate-300 mb-4">
                    Un assistant IA est disponible pour vous aider :
                </p>
                <ul className="text-slate-400 text-sm space-y-2">
                    <li>• Posez des questions sur la combustion</li>
                    <li>• Analysez des images de supervision</li>
                    <li>• Obtenez des conseils d'optimisation</li>
                </ul>
                <p className="text-indigo-400 text-sm mt-4">
                    💡 Cliquez sur l'icône 💬 en bas à droite pour discuter avec le mentor.
                </p>
            </>
        )
    },
    {
        title: "Accélération Temporelle",
        icon: Play,
        color: "from-amber-500 to-orange-500",
        content: (
            <>
                <p className="text-slate-300 mb-4">
                    Le simulateur fonctionne en temps réel, mais vous pouvez accélérer :
                </p>
                <ul className="text-slate-400 text-sm space-y-2">
                    <li>• <strong>1x</strong> : Temps réel</li>
                    <li>• <strong>10x</strong> : 10 fois plus rapide</li>
                    <li>• <strong>60x</strong> : Voir les effets sur 1 heure</li>
                </ul>
                <p className="text-amber-400 text-sm mt-4">
                    ⏱️ Utilisez le contrôle en haut à droite pour ajuster la vitesse.
                </p>
            </>
        )
    },
    {
        title: "Prêt à commencer !",
        icon: Sparkles,
        color: "from-pink-500 to-rose-500",
        content: (
            <>
                <p className="text-slate-300 mb-4">
                    Vous êtes maintenant prêt à explorer le simulateur !
                </p>
                <p className="text-slate-400 text-sm mb-4">
                    N'hésitez pas à expérimenter avec les réglages et observer
                    comment le système réagit.
                </p>
                <p className="text-emerald-400 text-sm">
                    ✨ Bon apprentissage !
                </p>
            </>
        )
    }
];

export default function OnboardingGuide({ onClose }: OnboardingGuideProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const step = STEPS[currentStep];
    const Icon = step.icon;
    const isLastStep = currentStep === STEPS.length - 1;
    const isFirstStep = currentStep === 0;

    const goToNext = () => {
        if (isLastStep) {
            handleClose();
        } else {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentStep(prev => prev + 1);
                setIsAnimating(false);
            }, 150);
        }
    };

    const goToPrev = () => {
        if (!isFirstStep) {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentStep(prev => prev - 1);
                setIsAnimating(false);
            }, 150);
        }
    };

    const handleClose = () => {
        // Mark as seen in localStorage
        localStorage.setItem('sovalem_onboarding_seen', 'true');
        onClose();
    };

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'Enter') goToNext();
            if (e.key === 'ArrowLeft') goToPrev();
            if (e.key === 'Escape') handleClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentStep]);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Header with gradient */}
                <div className={`bg-gradient-to-r ${step.color} p-6 relative`}>
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Icon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <p className="text-white/70 text-sm">Étape {currentStep + 1} / {STEPS.length}</p>
                            <h2 className="text-xl font-bold text-white">{step.title}</h2>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className={`p-6 transition-opacity duration-150 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
                    {step.content}
                </div>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 pb-4">
                    {STEPS.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentStep(index)}
                            className={`w-2 h-2 rounded-full transition-all ${index === currentStep
                                    ? 'bg-indigo-500 w-6'
                                    : 'bg-slate-600 hover:bg-slate-500'
                                }`}
                        />
                    ))}
                </div>

                {/* Navigation buttons */}
                <div className="flex items-center justify-between p-4 border-t border-slate-700">
                    <button
                        onClick={goToPrev}
                        disabled={isFirstStep}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isFirstStep
                                ? 'text-slate-600 cursor-not-allowed'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Précédent
                    </button>

                    <button
                        onClick={handleClose}
                        className="text-slate-500 hover:text-slate-300 text-sm"
                    >
                        Passer le guide
                    </button>

                    <button
                        onClick={goToNext}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isLastStep
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                    >
                        {isLastStep ? 'Commencer' : 'Suivant'}
                        {!isLastStep && <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Hook to determine if onboarding should be shown
 */
export function useOnboarding() {
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('sovalem_onboarding_seen');
        if (!hasSeenOnboarding) {
            // Small delay to let the app render first
            setTimeout(() => setShowOnboarding(true), 500);
        }
    }, []);

    const openOnboarding = () => setShowOnboarding(true);
    const closeOnboarding = () => setShowOnboarding(false);

    return { showOnboarding, openOnboarding, closeOnboarding };
}
