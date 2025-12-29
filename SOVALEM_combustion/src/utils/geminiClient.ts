import type { SimulatorContext } from './mentorEngine';

// Cloud Function URL - will be set after deployment
// For local development, use the emulator URL
const CLOUD_FUNCTION_URL = import.meta.env.VITE_GEMINI_FUNCTION_URL ||
    'https://europe-west1-sovalem-cadario-beta.cloudfunctions.net/geminiProxy';

interface GeminiProxyResponse {
    success: boolean;
    response?: string;
    error?: string;
    details?: string;
}

/**
 * Call Gemini API through secure Cloud Function proxy
 */
export async function askGemini(question: string, context: SimulatorContext, isLearning: boolean = false): Promise<string> {
    const systemPrompt = isLearning ? buildLearningPrompt(context) : buildSystemPrompt(context);
    const fullPrompt = systemPrompt + "\n\n" + question;

    try {
        const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: fullPrompt })
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorBody)}`);
        }

        const data: GeminiProxyResponse = await response.json();

        if (!data.success || !data.response) {
            throw new Error(data.error || 'No response from API');
        }

        return data.response;
    } catch (error) {
        console.error('Gemini API Error:', error);
        return `❌ **Erreur API**\n\nImpossible de contacter l'IA. \n\n**Détails techniques :**\n- ${error instanceof Error ? error.message : 'Unknown error'}\n\n*Vérifiez que la Cloud Function est bien déployée.*`;
    }
}

/**
 * Prompt for the "Knowledge Interviewer" mode
 */
function buildLearningPrompt(context: SimulatorContext): string {
    return `Tu es l'**Ingénieur de la Connaissance** pour le simulateur SOVALEM.
Ton but est d'extraire et de structurer le savoir technique (REX, manuels, NotebookLM) que l'utilisateur te transmet.

**TA MISSION** :
1. Analyse le texte brut fourni par l'utilisateur.
2. Pose 1 ou 2 questions de précision si l'info est trop vague (ex: seuil de température manquant, zone non précisée).
3. Si l'info est claire, propose une **Synthèse de Leçon** structurée ainsi :
   - **Titre** : Court et clair
   - **Condition/Déclencheur** : Quand appliquer ce savoir ?
   - **Action Corrective** : Que régler concrètement ?
   - **Explication** : Pourquoi fait-on cela ?

**IMPORTANT** :
- Sois rigoureux techniquement. Si l'utilisateur propose une action dangereuse (ex: couper l'air quand l'O2 baisse), lève un doute.
- Tutoiement professionnel.
- Garde en tête le contexte actuel : SH5=${context.sh5Temp}, O2=${context.o2}, Barycentre=${context.barycenter.toFixed(2)}.

Réponds à l'utilisateur maintenant :`;
}

/**
 * Build context-aware system prompt for Gemini
 */
function buildSystemPrompt(context: SimulatorContext): string {
    return `Tu es le **Super Mentor IA** de SOVALEM, expert en incinération de déchets et valorisation énergétique.

**TON RÔLE** :
- Conseiller les opérateurs sur le pilotage de la chaudière
- Expliquer les phénomènes physiques (combustion, transferts thermiques)
- Analyser les situations anormales
- Donner des recommandations actionnables

**CONTEXTE ACTUEL DU SIMULATEUR** :
- Température SH5 : ${context.sh5Temp}°C (Cible: < 620°C, Critique: > 640°C)
- Oxygène O2 : ${context.o2}% (Optimal: 6-7%)
- Barycentre Feu : ${context.barycenter.toFixed(2)} (Optimal: 3.0-3.5)
- Mode Régulation : Mode ${context.mode} ${context.mode === 2 ? '(Bilan Air - Auto)' : '(Loi Vapeur - Manuel)'}
- PCI Estimé : ${context.pci} kJ/kg (Référence: 9000-10000 kJ/kg)
- Air Secondaire : ${context.asFlow} Nm³/h
- Encrassement : ${context.fouling.toFixed(0)}%

**RÈGLES D'INSTALLATION SOVALEM** :
- 6 Rouleaux (R1-R6) répartis en 3 zones
- Zone 1 (R1-R2) : Séchage
- Zone 2 (R3-R4) : Combustion principale
- Zone 3 (R5-R6) : Finition

**TON STYLE DE RÉPONSE** :
1. **Concis** : Max 150 mots (sauf si analyse complexe demandée)
2. **Actionnable** : Toujours donner une action concrète
3. **Pédagogique** : Expliquer le "pourquoi"
4. **Contextuel** : Utiliser les données du simulateur dans ta réponse
5. **Professionnel** : Tutoiement, langage opérateur (pas académique)

**FORMAT** :
- Utilise des **gras** pour les points importants
- Utilise des listes pour la clarté
- Si alerte critique (SH5 > 640°C), commence par 🚨

Réponds maintenant à la question de l'opérateur :`;
}

/**
 * Check if API is configured (now always true since we use Cloud Function)
 */
export function isApiConfigured(): boolean {
    return true; // Cloud Function handles authentication
}

/**
 * Analyze supervision screenshots using Gemini Vision through Cloud Function
 */
export async function analyzeSupervisionImage(
    imageBase64: string,
    mimeType: string,
    additionalImages?: { base64: string; mimeType: string }[]
): Promise<string> {
    const imageCount = 1 + (additionalImages?.length || 0);
    const supervisionPrompt = buildSupervisionPrompt(imageCount);

    // Build image data array
    const imageData = [{ base64: imageBase64, mimeType }];

    if (additionalImages && additionalImages.length > 0) {
        for (const img of additionalImages) {
            imageData.push({ base64: img.base64, mimeType: img.mimeType });
        }
    }

    try {
        const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: supervisionPrompt,
                imageData
            })
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorBody)}`);
        }

        const data: GeminiProxyResponse = await response.json();

        if (!data.success || !data.response) {
            throw new Error(data.error || 'No response from API');
        }

        return data.response;
    } catch (error) {
        console.error('Gemini Vision Error:', error);
        return `❌ **Erreur Analyse Image**\n\n${error instanceof Error ? error.message : 'Erreur inconnue'}`;
    }
}

/**
 * Build the prompt for supervision image analysis
 */
function buildSupervisionPrompt(imageCount: number = 1): string {
    const multiImageNote = imageCount > 1
        ? `\n\n📷 **${imageCount} IMAGES À ANALYSER :**\nTu as ${imageCount} images de supervision à analyser ensemble. Combine les informations de toutes les vues (chaudière, four, etc.) pour une analyse complète.\n`
        : '';

    return `Tu es l'expert combustion SOVALEM. Analyse cette capture d'écran de supervision de chaudière d'incinération.${multiImageNote}

**ÉTAPE 1 - EXTRACTION DES VALEURS CRITIQUES (OBLIGATOIRE) :**

🔴 **PRIORITÉ ABSOLUE - T° Surchauffeur 5 (SH5) :**
- EMPLACEMENT EXACT : En BAS À GAUCHE de l'écran, zone intitulée "Zone Bas 1er Parcours"
- VALEUR : Affichée sur fond noir avec chiffres verts/blancs, typiquement 630-640°C
- C'est la valeur la plus importante à trouver ! Cherche un nombre autour de 630-640°C en bas à gauche.

Autres valeurs à extraire :
| Paramètre | Emplacement | Valeur Typique |
|-----------|-------------|----------------|
| T° Moy Foyer (Zone Haut 1er Parcours) | En haut à gauche du four | ~995-1000°C |
| O2 Sortie Four | Zone droite, près filtre à manches | 4-8% |
| Débit Vapeur | Haut de l'écran | ~30.6 T/h |
| Pression Ballon | Haut, près du ballon | ~48 bar |
| Températures Surchauffeurs (SH1-SH4) | Sur le schéma, valeurs vertes | 314°C, 414°C, 424°C... |

**ÉTAPE 2 - AFFICHE LE TABLEAU DES VALEURS LUES :**
| Paramètre | Valeur Extraite |
|-----------|-----------------|
| **T° SH5** | ??? °C ← INDISPENSABLE |
| T° Foyer | ??? °C |
| O2 | ??? % |
| Vapeur | ??? T/h |

**ÉTAPE 3 - DIAGNOSTIC SH5 :**
- T° SH5 < 620°C : ✅ OK
- T° SH5 entre 620-640°C : ⚠️ ATTENTION - Surveiller
- T° SH5 > 640°C : 🚨 CRITIQUE - Action immédiate

**ÉTAPE 4 - RECOMMANDATIONS (max 3 actions concrètes)**

Réponds de manière concise. Tutoiement opérateur.
RAPPEL: Tu DOIS commencer par afficher la T° SH5 extraite de l'image.`;
}
