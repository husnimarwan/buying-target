// src/utils/auth.js

import { 
  signInWithPopup, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

// Sign in with Google
export const signInWithGoogle = async () => {
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