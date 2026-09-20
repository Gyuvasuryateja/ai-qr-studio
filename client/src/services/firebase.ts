import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBoy6GQ0meoGPVu2PDYwgRx-JtLFane4J4",
  authDomain: "custome-qr.firebaseapp.com",
  projectId: "custome-qr",
  storageBucket: "custome-qr.firebasestorage.app",
  messagingSenderId: "830126401050",
  appId: "1:830126401050:web:4a3e2ee258db4624d8d3a3",
  measurementId: "G-RP5E04PPH0"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
