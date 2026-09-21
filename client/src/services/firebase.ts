import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) || "AIzaSyCYRQEQsD19bhhyP1bAS3_Wvt7ZR27hzHE",
  authDomain: "custom-qr-for-u.firebaseapp.com",
  projectId: "custom-qr-for-u",
  storageBucket: "custom-qr-for-u.firebasestorage.app",
  messagingSenderId: "613516221445",
  appId: "1:613516221445:web:3fe038a370b0159a75106c",
  measurementId: "G-F62ZXRWL70"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
