/**
 * Firebase Configuration
 * This file initializes Firebase services for the application
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration for sovalem-cadario-beta
const firebaseConfig = {
    apiKey: "AIzaSyBxwm9KBW2sSum6n9wJHlpDSr_JcNCOloE",
    authDomain: "sovalem-cadario-beta.firebaseapp.com",
    projectId: "sovalem-cadario-beta",
    storageBucket: "sovalem-cadario-beta.firebasestorage.app",
    messagingSenderId: "68438816818",
    appId: "1:68438816818:web:78a1e54b6bd0174957a42b",
    measurementId: "G-8BZS2SXYW8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

export default app;
