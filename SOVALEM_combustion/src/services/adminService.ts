/**
 * Admin Service
 * Manages the list of admin users from Firestore
 * 
 * Collection: config/admins
 * Format: { emails: ['admin1@email.com', 'admin2@email.com'] }
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Cache for admin emails to avoid repeated Firestore reads
let adminEmailsCache: string[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Fallback admins (used only if Firestore is unavailable)
const FALLBACK_ADMINS = ['stephanecadario@gmail.com', 'carolinecadario@gmail.com'];

/**
 * Get the list of admin emails from Firestore
 * Uses caching to minimize reads
 */
export async function getAdminEmails(): Promise<string[]> {
    const now = Date.now();

    // Return cache if valid
    if (adminEmailsCache && (now - cacheTimestamp) < CACHE_DURATION_MS) {
        return adminEmailsCache;
    }

    try {
        const docRef = doc(db, 'config', 'admins');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            adminEmailsCache = (data.emails || []).map((e: string) => e.toLowerCase().trim());
            cacheTimestamp = now;
            return adminEmailsCache!;
        } else {
            // Document doesn't exist yet, use fallback
            console.warn('Admin config not found in Firestore, using fallback...');
            return FALLBACK_ADMINS;
        }
    } catch (error) {
        console.error('Error fetching admin emails:', error);
        // Return fallback on error
        return FALLBACK_ADMINS;
    }
}

/**
 * Check if an email is an admin
 */
export async function isAdmin(email: string | null | undefined): Promise<boolean> {
    if (!email) return false;
    const admins = await getAdminEmails();
    return admins.includes(email.toLowerCase().trim());
}

/**
 * Initialize admin config document (one-time setup)
 */
export async function initializeAdminConfig(): Promise<void> {
    try {
        const docRef = doc(db, 'config', 'admins');
        await setDoc(docRef, {
            emails: FALLBACK_ADMINS,
            updatedAt: new Date(),
            description: 'Liste des emails administrateurs SOVALEM'
        });
        console.log('Admin config initialized in Firestore');
        adminEmailsCache = FALLBACK_ADMINS;
        cacheTimestamp = Date.now();
    } catch (error) {
        console.error('Failed to initialize admin config:', error);
    }
}

/**
 * Clear the cache (useful after admin changes)
 */
export function clearAdminCache(): void {
    adminEmailsCache = null;
    cacheTimestamp = 0;
}
