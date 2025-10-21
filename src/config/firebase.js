// src/config/firebase.js

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBlq54PvjA_Iob-Amum8KZdJ53aWvhVNgI",
  authDomain: "buying-target.firebaseapp.com",
  projectId: "buying-target",
  storageBucket: "buying-target.firebasestorage.app",
  messagingSenderId: "708740862331",
  appId: "1:708740862331:web:cdb6e372023477cbac2dde",
  measurementId: "G-9Z17PPY75M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;