// src/utils/auth.js

import { 
  signInWithPopup, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

// Check if Firebase auth is properly configured
const isAuthAvailable = () => {
  return auth !== null;
};

// Sign in with Google
export const signInWithGoogle = async () => {
  if (!isAuthAvailable()) {
    console.warn('Firebase is not configured. Cannot sign in with Google.');
    alert('Authentication features are not available. Please configure Firebase to use this feature.');
    return null;
  }
  
  try {
    console.log('Attempting to sign in with Google...');
    const result = await signInWithPopup(auth, googleProvider);
    console.log('Sign in successful:', result);
    const user = result.user;
    
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    };
  } catch (error) {
    console.error('Error during Google sign in:', error);
    // More specific error handling
    if (error.code === 'auth/popup-blocked') {
      alert('Please allow popups for this site to sign in with Google');
    } else if (error.code === 'auth/cancelled-popup-request') {
      console.log('Sign in was cancelled');
    } else {
      alert(`Sign in failed: ${error.message}`);
    }
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  if (!isAuthAvailable()) {
    console.warn('Firebase is not configured. Cannot sign out.');
    // If auth is not available, just return without error
    return;
  }
  
  try {
    console.log('Attempting to sign out...');
    await signOut(auth);
    console.log('Sign out successful');
  } catch (error) {
    console.error('Error during sign out:', error);
    alert(`Sign out failed: ${error.message}`);
    throw error;
  }
};

// Listen to auth state changes
export const onAuthChange = (callback) => {
  if (!isAuthAvailable()) {
    console.warn('Firebase is not configured. Auth state listener will use local-only mode.');
    // Simulate an unauthenticated state when auth is not available
    callback(null);
    // Return a dummy function that does nothing
    return () => {};
  }
  
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      });
    } else {
      callback(null);
    }
  });
};