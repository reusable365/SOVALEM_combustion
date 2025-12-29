export interface HelpEntry {
    title: string;
    description: string;
    details: string[];
    formula?: string;
}

export const HELP_CONTENT: Record<string, HelpEntry> = {
    'eco-score': {
        title: "Score Économique & Rentabilité",
        description: "Cet indicateur mesure la marge opérationnelle instantanée de votre pilotage.",
        details: [
            "Gain (+) : La vapeur produite est valorisée (ex: 45€/T).",
            "Coût (-) : L'électricité des ventilateurs (surtout en Mode 2) et l'usure liée à l'encrassement.",
            "Objectif : Maximiser ce score (viser > 80%). Parfois, réduire légèrement l'air augmente la rentabilité globale."
        ],
        formula: "Marge = (Vapeur x Prix) - (Air x Coût Elec) - (Encrassement x Coût Maint)"
    },
    'pci-dynamic': {
        title: "PCI Dynamique (Pouvoir Calorifique)",
        description: "Estimation en temps réel de la puissance thermique de vos déchets.",
        details: [
            "Principe : Le simulateur compare la vapeur produite (Sortie) avec la quantité de déchets enfournée (Entrée).",
            "PCI Élevé (> 10000 kJ/kg) : Déchets secs, plastiques. Risque de surchauffe SH5.",
            "PCI Faible (< 8000 kJ/kg) : Déchets humides, gravats. Risque d'imbrûlés et chute T°."
        ],
        formula: "PCI = PCI_Théorique x (Rendement_Réel / Rendement_Nominal)"
    },
    'sh5-temp': {
        title: "Température Surchauffeur 5 (SH5)",
        description: "C'est la température critique de l'installation. Elle reflète l'intensité du foyer.",
        details: [
            "Cible : < 620°C (Zone verte).",
            "Danger : > 640°C (Corrosion accélérée).",
            "Leviers : Augmenter l'Air Secondaire (Refroidissement) ou baisser la Charge (Poussoir)."
        ],
        formula: "SH5 = f(PCI, Position_Feu, Air_Secondaire, Encrassement)"
    },
    'fouling': {
        title: "Encrassement (Fouling)",
        description: "Simulation du dépôt de suies sur les échangeurs thermiques.",
        details: [
            "Effet : Bloque l'échange de chaleur. Pour une même flamme, la T° des fumées reste haute car l'eau ne capte plus l'énergie.",
            "Action : Le 'Ramonage' nettoie les échangeurs (Baisse T° SH5, Monte rendement)."
        ]
    },
    'inertia': {
        title: "Inertie Thermique",
        description: "Le simulateur intègre le délai de réaction physique de la chaudière.",
        details: [
            "Phénomène : Une tonne de métal et d'eau ne chauffe pas instantanément.",
            "Conséquence : Vos actions (Air, Poussoir) mettent 15 à 20 minutes à avoir leur plein effet sur la T° SH5.",
            "Conseil : Soyez patient ! Ne modifiez pas les réglages toutes les 30 secondes."
        ]
    },
    'barycenter': {
        title: "Barycentre du Feu",
        description: "Position moyenne géométrique de la combustion dans le four.",
        details: [
            "Position 1-2 : Feu en amont (séchage) - risque de flammes trop courtes.",
            "Position 3-4 : Position optimale (combustion intense).",
            "Position 5-6 : Feu en aval - risque d'imbrûlés dans les mâchefers."
        ],
        formula: "Barycentre = Σ(Zone_i × Air_i) / Σ(Air_i)"
    },
    'steam-flow': {
        title: "Débit Vapeur",
        description: "Quantité de vapeur produite par la chaudière, reflet de la puissance thermique.",
        details: [
            "Objectif : Maximiser la vapeur tout en respectant les contraintes (SH5 < 620°C).",
            "Unité : Tonnes par heure (T/h).",
            "Lien : Plus le PCI est élevé, plus le débit vapeur potentiel est important."
        ],
        formula: "Vapeur = Déchets × PCI × Rendement_Chaudière"
    },
    'o2-level': {
        title: "Taux d'Oxygène (O₂)",
        description: "Pourcentage d'oxygène résiduel dans les fumées après combustion.",
        details: [
            "Cible : 6-8% pour une combustion optimale.",
            "Trop bas (< 5%) : Combustion incomplète, CO élevé, imbrûlés.",
            "Trop haut (> 10%) : Excès d'air, refroidissement du foyer, gaspillage énergie."
        ],
        formula: "O₂ = 21% - (O₂_consommé_par_combustion)"
    }
};

// Tooltip summaries for quick hover display
export const TOOLTIP_FORMULAS: Record<string, { label: string; formula: string; hint: string }> = {
    'sh5-temp': {
        label: 'T° SH5',
        formula: 'SH5 = PCI × Position_Feu - Air_Sec × 0.3',
        hint: 'Plus le feu est intense et vers l\'avant, plus SH5 monte'
    },
    'eco-score': {
        label: 'Score Éco',
        formula: 'Score = (Vapeur × 45€) - Coûts_Air - Coûts_Encrassement',
        hint: 'Optimisez la vapeur tout en limitant la consommation d\'air'
    },
    'steam-flow': {
        label: 'Débit Vapeur',
        formula: 'Vapeur = Tonnage × PCI × Rendement',
        hint: 'Dépend du PCI des déchets et de l\'efficacité de la combustion'
    },
    'o2-level': {
        label: 'O₂ Fumées',
        formula: 'O₂ = 21% - O₂_consommé',
        hint: 'Viser 6-8% : équilibre entre rendement et sécurité'
    },
    'barycenter': {
        label: 'Barycentre',
        formula: 'Bary = Σ(Zone × Air) / Σ(Air)',
        hint: 'Position pondérée du feu selon la répartition de l\'air'
    },
    'as-calculated': {
        label: 'Air Secondaire Calculé',
        formula: 'AS = f(Mode, Barycentre, SH5, O₂)',
        hint: 'Régulation automatique pour maintenir la vapeur cible'
    },
    'estim-sh5': {
        label: 'SH5 Estimée',
        formula: 'Estim = Tendance(SH5) sur 10 min',
        hint: 'Projection basée sur la vitesse de variation actuelle'
    }
};
