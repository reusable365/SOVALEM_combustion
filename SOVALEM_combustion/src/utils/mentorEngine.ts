import knowledgeBase from '../data/mentorKnowledge.json';
import { askGemini, isApiConfigured } from './geminiClient';

export interface MentorLesson {
    id: string;
    category: string;
    keywords: string[];
    question: string;
    answer: string;
    source: string;
}

export interface SimulatorContext {
    sh5Temp: number;
    o2: number;
    barycenter: number;
    mode: 1 | 2;
    fouling: number;
    pci: number;
    asFlow: number;
}

/**
 * Analyze user question and return best matching lesson
 * PREMIUM VERSION: Uses Gemini API if configured
 */
export async function analyzeQuestion(
    question: string,
    context: SimulatorContext,
    isLearning: boolean = false
): Promise<string> {
    // 1. Try Premium API first
    if (isApiConfigured()) {
        try {
            return await askGemini(question, context, isLearning);
        } catch (error) {
            console.error('Premium AI failed, falling back to basic:', error);
            // Fallback to basic mode if API fails
        }
    }

    // BASIC: Pattern matching
    const normalizedQ = question.toLowerCase();

    // 1. Search for keyword matches
    const lessons = knowledgeBase.lessons as MentorLesson[];
    const matches = lessons.filter(lesson =>
        lesson.keywords.some(kw => normalizedQ.includes(kw.toLowerCase()))
    );

    // 2. If exact match found
    if (matches.length > 0) {
        const bestMatch = matches[0];
        return formatResponse(bestMatch, context);
    }

    // 3. Context-based response (no keyword match)
    return generateContextualResponse(normalizedQ, context);
}

/**
 * Format lesson answer with current simulator context
 */
function formatResponse(lesson: MentorLesson, context: SimulatorContext): string {
    let response = `**${lesson.question}**\n\n${lesson.answer}`;

    // Add contextual info
    response += `\n\n---\n**État actuel de votre simulateur** :\n`;
    response += `- SH5 : ${context.sh5Temp}°C ${context.sh5Temp > 620 ? '⚠️ Critique' : '✅'}\n`;
    response += `- O2 : ${context.o2}%\n`;
    response += `- Barycentre : ${context.barycenter.toFixed(2)}\n`;
    response += `- Mode : ${context.mode}\n`;

    // Add specific warnings
    if (lesson.category === 'temperature' && context.sh5Temp > 640) {
        response += `\n🚨 **ATTENTION** : Votre SH5 est en zone dangereuse !`;
    }

    if (lesson.category === 'fouling' && context.fouling > 30) {
        response += `\n⚠️ **Votre encrassement est à ${context.fouling.toFixed(0)}%** - Ramonage recommandé.`;
    }

    response += `\n\n*Source : ${lesson.source}*`;

    return response;
}

/**
 * Generate response when no keyword match (fallback)
 */
function generateContextualResponse(question: string, context: SimulatorContext): string {
    // Check for general help request
    if (question.includes('aide') || question.includes('help') || question.includes('?')) {
        return `Je peux vous aider sur :\n\n` +
            `- 🌡️ Température SH5 et surchauffe\n` +
            `- 🔥 Réglage barycentre\n` +
            `- 💨 Oxygène et combustion\n` +
            `- ⚙️ Modes de régulation\n` +
            `- 🧹 Encrassement et ramonage\n` +
            `- 🔬 PCI et qualité déchets\n\n` +
            `**Posez-moi une question spécifique !**`;
    }

    // Analyze current state and suggest
    const issues = [];

    if (context.sh5Temp > 620) {
        issues.push(`Votre SH5 est élevé (${context.sh5Temp}°C). Tapez "SH5" pour voir les actions.`);
    }

    if (context.fouling > 40) {
        issues.push(`Votre encrassement est important (${context.fouling.toFixed(0)}%). Tapez "ramonage".`);
    }

    if (context.barycenter < 2.5 || context.barycenter > 4.0) {
        issues.push(`Votre barycentre est décentré (${context.barycenter.toFixed(2)}). Tapez "barycentre".`);
    }

    if (issues.length > 0) {
        return `Je n'ai pas compris votre question, mais j'ai détecté :\n\n${issues.join('\n\n')}`;
    }

    return `Désolé, je n'ai pas compris votre question. Essayez de reformuler ou demandez "aide".`;
}

/**
 * Get all available lessons
 */
export function getAllLessons(): MentorLesson[] {
    return knowledgeBase.lessons as MentorLesson[];
}

/**
 * Search lessons by category
 */
export function getLessonsByCategory(category: string): MentorLesson[] {
    return (knowledgeBase.lessons as MentorLesson[]).filter(l => l.category === category);
}
