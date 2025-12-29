# BIBLE DE RÉGULATION EXPERT (SOVALEM)

Source de vérité pour l'algorithme de simulation.

## 1. DYNAMIQUE DE COMBUSTION
- **Temps de séjour** : ~1h00 entre l'entrée (Poussoir) et la sortie (Mâchefers).
- **Inertie thermique** : Une action sur le Poussoir met 45-60 min à impacter le SH5. Une action sur l'Air Secondaire met 2-5 min.

## 2. RÉGULATION DE L'AIR (CŒUR DU SYSTÈME)

### Air Primaire (AP) - "Le Moteur"
- **Architecture** : 1 Ventilateur Pression (PIC10164) + 6 Registres Débit (FIC103x2).
- **Le Piège** : Débit Ventilateur > Somme des Zones (écart ~6000 Nm3/h dû à la ventilation fosse).
- **Règle Simu** : Toujours utiliser la Somme(Débits Zones) pour le bilan stœchiométrique.

### Air Secondaire (AS) - "Le Bouclier"
- **Fonction** : Régulation O2 + Cassage de flamme (Protection SH5).
- **Sélecteur de Mode** :
    - **Mode 1 (Actuel)** : AS = f(Vapeur). Trop passif.
    - **Mode 2 (Cible)** : AS = Besoin Total - AP Mesuré. C'est le mode "Sécurité".
- **Problème Matériel** : Suspicion de buses bouchées (Commande > 80% mais débit faible).

## 3. RÉGULATION GRILLE (ALIMENTATION)

### Poussoir (ST10400)
- **Vitesse** : $Base(Vapeur) \times K_{O2} \times K_{Vapeur} \times K_{Pyro} \times K_{Charge}(KP)$.
- **KP (Coefficient de Perte de Charge)** : Image de la hauteur de couche sur R1. Si KP monte (bouchon), le poussoir ralentit.

### Rouleaux (R1-R6)
- **R1** : Esclave du Poussoir (Vitesse proportionnelle).
- **R2-R6** : Esclaves de la Combustion (Corrigés par O2, Vapeur et Pyro).
- **Le Pyro** : Détection de position de feu. Souvent forcé manuellement (50%) car la caméra est inefficace (flamèches).

## 4. STRATÉGIE OPTIMALE (L'IA DOIT VISER ÇA)
- **Détection DIB** : Si le ratio DIB monte, l'IA doit conseiller de baisser le KAP (AP) et monter l'AS (Bouclier).
- **Protection SH5** : Si T° SH5 > 620°C, priorité absolue à l'Air Secondaire pour refroidir, quitte à monter l'O2 temporairement.
