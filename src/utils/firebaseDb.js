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
    // Create a clean target object with only the properties we want to store
    const cleanTarget = {
      id: target.id,
      name: target.name,
      price: target.price,
      budget: target.budget,
      userId: userId,
      history: Array.isArray(target.history) ? target.history : []
    };
    
    const targetWithUser = prepareDataForFirestore(cleanTarget);
    
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
const prepareDataForFirestore = (obj) => {
  // Create a completely new object to avoid any prototype issues
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => prepareDataForFirestore(item));
  }

  if (typeof obj === 'object') {
    // Create a plain object with no prototype
    const cleanObj = Object.create(null);
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
        cleanObj[key] = value;
      } else if (value instanceof Date) {
        cleanObj[key] = value.toISOString();
      } else if (Array.isArray(value)) {
        cleanObj[key] = prepareDataForFirestore(value);
      } else if (typeof value === 'object') {
        cleanObj[key] = prepareDataForFirestore(value);
      } else {
        // For any other type, convert to string representation or null
        cleanObj[key] = JSON.stringify(value);
      }
    }
    
    return cleanObj;
  }

  return obj;
};

// Update an existing target in Firestore
export const updateTargetInFirebase = async (targetId, target) => {
  if (!isFirebaseAvailable()) {
    console.warn('Firebase is not configured. Skipping Firebase update.');
    return null;
  }
  
  try {
    console.log('Attempting to update target in Firestore with:', target);
    
    // Create a clean target object with only the properties we want to store
    const cleanTarget = {
      id: target.id,
      name: target.name,
      price: target.price,
      budget: target.budget,
      userId: target.userId,
      history: Array.isArray(target.history) ? target.history : []
    };
    
    const preparedTarget = prepareDataForFirestore(cleanTarget);
    console.log('Prepared target for Firestore:', preparedTarget);
    
    const targetRef = doc(firestore, TARGETS_COLLECTION, targetId);
    await updateDoc(targetRef, preparedTarget);
    return { id: targetId, ...preparedTarget };
  } catch (error) {
    console.error('Error updating target in Firestore:', error);
    console.error('Target data that caused the error:', target);
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
const convertFirestoreDataToAppFormat = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertFirestoreDataToAppFormat(item));
  }

  if (typeof obj === 'object') {
    const result = Object.create(null);
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
        result[key] = value;
      } else if (Array.isArray(value)) {
        result[key] = convertFirestoreDataToAppFormat(value);
      } else if (typeof value === 'object') {
        result[key] = convertFirestoreDataToAppFormat(value);
      } else {
        // For any other type, try to parse if it was JSON.stringified
        try {
          result[key] = JSON.parse(value);
        } catch (e) {
          result[key] = value;
        }
      }
    }
    
    return result;
  }

  return obj;
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
        const docData = doc.data();
        // Ensure we create a clean object with expected properties
        const cleanTarget = {
          id: doc.id,
          name: docData.name || '',
          price: typeof docData.price === 'number' ? docData.price : 0,
          budget: typeof docData.budget === 'number' ? docData.budget : 0,
          userId: docData.userId,
          history: Array.isArray(docData.history) ? docData.history : []
        };
        
        const formattedTarget = convertFirestoreDataToAppFormat(cleanTarget);
        targets.push(formattedTarget);
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