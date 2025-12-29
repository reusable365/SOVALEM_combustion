/**
 * Allowed Users Service
 * Manages the list of authorized users in Firestore
 */

import {
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc,
    query,
    where
} from 'firebase/firestore';
import { db } from '../firebase';
import { getAdminEmails } from './adminService';

const COLLECTION_NAME = 'allowedUsers';

export interface AllowedUser {
    email: string;
    name: string;
    addedAt: Date;
    addedBy: string;
}

/**
 * Check if an email is in the allowed list
 */
export async function isEmailAllowed(email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user is an admin (from Firestore config)
    const adminEmails = await getAdminEmails();
    if (adminEmails.includes(normalizedEmail)) {
        return true;
    }

    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('email', '==', normalizedEmail)
        );
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking allowed user:', error);
        // On error, still check against admin list
        return adminEmails.includes(normalizedEmail);
    }
}

/**
 * Add an email to the allowed list
 */
export async function addAllowedUser(
    email: string,
    name: string,
    addedBy: string
): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const docRef = doc(db, COLLECTION_NAME, normalizedEmail);

    await setDoc(docRef, {
        email: normalizedEmail,
        name: name,
        addedAt: new Date(),
        addedBy: addedBy
    });
}

/**
 * Remove an email from the allowed list
 */
export async function removeAllowedUser(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const docRef = doc(db, COLLECTION_NAME, normalizedEmail);
    await deleteDoc(docRef);
}

/**
 * Get all allowed users
 */
export async function getAllAllowedUsers(): Promise<AllowedUser[]> {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map(doc => doc.data() as AllowedUser);
}
