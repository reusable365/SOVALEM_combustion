/**
 * Access Request Service
 * Manages access requests in Firestore
 */

import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    type Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

export interface AccessRequest {
    id?: string;
    email: string;
    name: string;
    service: string;
    message?: string;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
}

const COLLECTION_NAME = 'accessRequests';

/**
 * Submit a new access request
 */
export async function submitAccessRequest(
    email: string,
    name: string,
    service: string,
    message?: string
): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        service: service.trim(),
        message: message?.trim() || '',
        status: 'pending',
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

/**
 * Get all pending access requests (for admin)
 */
export async function getPendingRequests(): Promise<AccessRequest[]> {
    const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as AccessRequest));
}

/**
 * Get all access requests (for admin)
 */
export async function getAllRequests(): Promise<AccessRequest[]> {
    const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as AccessRequest));
}

/**
 * Approve an access request
 */
export async function approveRequest(requestId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, requestId);
    await updateDoc(docRef, {
        status: 'approved',
        updatedAt: serverTimestamp(),
    });
}

/**
 * Reject an access request with a reason
 */
export async function rejectRequest(requestId: string, reason: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, requestId);
    await updateDoc(docRef, {
        status: 'rejected',
        rejectionReason: reason,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Delete an access request
 */
export async function deleteRequest(requestId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, requestId);
    await deleteDoc(docRef);
}

/**
 * Check if an email has a pending request
 */
export async function hasPendingRequest(email: string): Promise<boolean> {
    const q = query(
        collection(db, COLLECTION_NAME),
        where('email', '==', email.toLowerCase().trim()),
        where('status', '==', 'pending')
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
}
