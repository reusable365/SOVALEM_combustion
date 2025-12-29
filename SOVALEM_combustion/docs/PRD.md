# PRD : DIGITAL TWIN SOVALEM (SUPERVISION & OPTIMISATION)

## 1. VISION PRODUIT
Outil d'aide à la décision pour stabiliser la température du Surchauffeur 5 (SH5) < 620°C.
Il combine l'analyse de données historiques et la simulation prédictive pour compenser les angles morts du pilotage actuel (Air Secondaire sous-exploité, Pyro défaillant, Mix DIB subi).

## 2. FONCTIONNALITÉS CLES

### A. Module "Forensic" (Analyse Historique)
- **Import** : Drag & Drop de fichiers CSV (Supervision + Arrivages Pont-Bascule).
- **Visualisation** : Graphiques synchronisés (Vapeur, O2, T° SH5, Débits Air, Vitesses).
- **Intelligence** :
    - Détection automatique des "Séquences Critiques" (SH5 > 630°C).
    - Corrélation croisée : "Lors des pics de T°, le ratio Air Secondaire/Total était de X%".

### B. Module "Simulateur Temps Réel"
- **Moteur Physique** : Intègre les inerties (Grille = 1h / Air = Immédiat).
- **Mode "Ghost"** : Affiche en superposition :
    - Courbe Réelle (ce qui s'est passé).
    - Courbe Simulée (ce qui se serait passé avec les nouveaux réglages).
- **Logique Bilan (Mode 2)** : Si l'utilisateur baisse l'Air Primaire (KAP), l'Air Secondaire augmente dynamiquement.

### C. Module "Vision & Acquisition" (Smart Capture)
- **Objectif** : Digitaliser la supervision actuelle (écrans non connectés).
- **Fonction** :
    - L'opérateur prend une photo de l'écran (ou webcam fixe).
    - L'outil utilise un OCR (Tesseract.js ou équivalent) pour lire les valeurs dans les zones vertes/violettes (Consigne/Mesure).
    - Les valeurs (Débit Vapeur, O2, T° SH5) sont injectées directement dans le simulateur.

## 3. TABLEAU DE BORD (UX DESIGN)
- **Style** : Industriel, Sombre (#0f172a), Typo Monospace.
- **Vues** :
    - **Synoptique** : Image de fond (plan chaudière) avec badges de valeurs live.
    - **Contrôles** : Sliders verticaux pour les zones d'air (Z1, Z2, Z3).
    - **Radar de Performance** : T2s / O2 / SH5 / Vapeur.

## 4. INDICATEURS CALCULÉS (KPIs)
- **Barycentre Feu (1.0 - 6.0)** : Position théorique de la combustion.
- **Ratio DIB (%)** : Estimé via les arrivages ou déduit de la consommation d'air.
- **Efficacité Bouclier (%)** : Ratio Débit AS / Débit Total.
- **Coefficient KP** : Charge hydraulique du poussoir (Image de l'épaisseur du lit).
