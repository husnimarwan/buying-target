// src/utils/firebaseDb.js

import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  onSnapshot 
} from 'firebase/firestore';
import { firestore } from '../config/firebase';

// Collection name for targets
const TARGETS_COLLECTION = 'targets';

// Check if Firebase is properly configured
const isFirebaseAvailable = () => {
  return firestore !== null;
};

// Get all targets for the current user
export const getAllTargetsFirebase = async (userId) => {
  if (!isFirebaseAvailable()) {
    console.warn('Firebase is not configured. Returning empty array.');
    return [];
  }
  
  try {
    const q = query(collection(firestore, TARGETS_COLLECTION), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const targets = [];
    querySnapshot.forEach((doc) => {
      const docData = convertFirestoreDataToAppFormat({ id: doc.id, ...doc.data() });
      targets.push(docData);
    });
    
    return targets;
  } catch (error) {
    console.error('Error getting targets from Firestore:', error);
    // Check if it's a Firestore-specific error (like if Firestore isn't enabled)
    if (error.code === 'unavailable' || error.code === 'permission-denied' || error.code === 'not-found') {
      console.warn('Firestore is not properly configured or enabled. Returning empty array.');
      return [];
    }
    // Return empty array as fallback for other errors too
    return [];
  }
};

// Add a new target to Firestore
export const addTargetToFirebase = async (userId, target) => {
  if (!isFirebaseAvailable()) {
    console.warn('Firebase is not configured. Skipping Firebase add.');
    return null;
  }
  
  try {
    const targetWithUser = prepareDataForFirestore({
      ...target,
      userId,
    });
    
    const docRef = await addDoc(collection(firestore, TARGETS_COLLECTION), targetWithUser);
    return { id: docRef.id, ...targetWithUser };
  } catch (error) {
    console.error('Error adding target to Firestore:', error);
    // Check if it's a Firestore-specific error
    if (error.code === 'unavailable' || error.code === 'permission-denied' || error.code === 'failed-precondition') {
      console.warn('Cannot add target to Firestore. This may be because:', error.message || '');
      console.warn('- Firestore has not been properly initialized in your Firebase project');
      console.warn('- Security rules are preventing access');
      console.warn('- The database location is not properly set');
      return null;
    }
    // For other errors, we might still want to throw them
    if (error.code !== 'permission-denied' && error.code !== 'unavailable' && error.code !== 'failed-precondition') {
      throw error;
    }
    return null;
  }
};

// Helper function to ensure data is Firestore-compatible
const prepareDataForFirestore = (data) => {
  if (Array.isArray(data)) {
    return data.map(item => prepareDataForFirestore(item));
  } else if (typeof data === 'object' && data !== null) {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Date) {
        result[key] = value.toISOString(); // Convert dates to ISO strings
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key] = prepareDataForFirestore(value); // Recursively process nested objects
      } else if (Array.isArray(value)) {
        result[key] = prepareDataForFirestore(value); // Process arrays
      } else {
        result[key] = value; // Keep primitives as is
      }
    }
    return result;
  }
  return data;
};

// Update an existing target in Firestore
export const updateTargetInFirebase = async (targetId, target) => {
  if (!isFirebaseAvailable()) {
    console.warn('Firebase is not configured. Skipping Firebase update.');
    return null;
  }
  
  try {
    const targetRef = doc(firestore, TARGETS_COLLECTION, targetId);
    const preparedTarget = prepareDataForFirestore(target);
    await updateDoc(targetRef, preparedTarget);
    return { id: targetId, ...preparedTarget };
  } catch (error) {
    console.error('Error updating target in Firestore:', error);
    // Check if it's a Firestore-specific error
    if (error.code === 'unavailable' || error.code === 'permission-denied' || error.code === 'failed-precondition') {
      console.warn('Cannot update target in Firestore. This may be because:', error.message || '');
      return null;
    }
    // For other errors, we might still want to throw them
    if (error.code !== 'permission-denied' && error.code !== 'unavailable' && error.code !== 'failed-precondition') {
      throw error;
    }
    return null;
  }
};

// Delete a target from Firestore
export const deleteTargetFromFirebase = async (targetId) => {
  if (!isFirebaseAvailable()) {
    console.warn('Firebase is not configured. Skipping Firebase delete.');
    return null;
  }
  
  try {
    await deleteDoc(doc(firestore, TARGETS_COLLECTION, targetId));
  } catch (error) {
    console.error('Error deleting target from Firestore:', error);
    // Check if it's a Firestore-specific error
    if (error.code === 'unavailable' || error.code === 'permission-denied' || error.code === 'failed-precondition') {
      console.warn('Cannot delete target from Firestore. This may be because:', error.message || '');
      return null;
    }
    // For other errors, we might still want to throw them
    if (error.code !== 'permission-denied' && error.code !== 'unavailable' && error.code !== 'failed-precondition') {
      throw error;
    }
    return null;
  }
};

// Helper function to convert Firestore data back to app format
const convertFirestoreDataToAppFormat = (data) => {
  if (Array.isArray(data)) {
    return data.map(item => convertFirestoreDataToAppFormat(item));
  } else if (typeof data === 'object' && data !== null) {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        // If it looks like an ISO date string, keep it as string (toLocaleString format)
        result[key] = value;
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key] = convertFirestoreDataToAppFormat(value); // Recursively process nested objects
      } else if (Array.isArray(value)) {
        result[key] = convertFirestoreDataToAppFormat(value); // Process arrays
      } else {
        result[key] = value; // Keep primitives as is
      }
    }
    return result;
  }
  return data;
};

// Set up real-time listener for targets
export const subscribeToTargets = (userId, callback) => {
  if (!isFirebaseAvailable()) {
    console.warn('Firebase is not configured. Returning dummy unsubscribe function.');
    // Return a dummy unsubscribe function
    return () => {};
  }
  
  try {
    const q = query(collection(firestore, TARGETS_COLLECTION), where('userId', '==', userId));
    
    return onSnapshot(q, (querySnapshot) => {
      const targets = [];
      querySnapshot.forEach((doc) => {
        const docData = convertFirestoreDataToAppFormat({ id: doc.id, ...doc.data() });
        targets.push(docData);
      });
      callback(targets);
    }, (error) => {
      console.error('Error in Firestore real-time listener:', error);
      // Still call the callback with an empty array to prevent the app from hanging
      callback([]);
    });
  } catch (error) {
    console.error('Error setting up Firestore real-time listener:', error);
    // Return a dummy unsubscribe function
    return () => {};
  }
};