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

// Get all targets for the current user
export const getAllTargetsFirebase = async (userId) => {
  try {
    const q = query(collection(firestore, TARGETS_COLLECTION), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const targets = [];
    querySnapshot.forEach((doc) => {
      targets.push({ id: doc.id, ...doc.data() });
    });
    
    return targets;
  } catch (error) {
    console.error('Error getting targets from Firestore:', error);
    throw error;
  }
};

// Add a new target to Firestore
export const addTargetToFirebase = async (userId, target) => {
  try {
    const targetWithUser = {
      ...target,
      userId,
    };
    
    const docRef = await addDoc(collection(firestore, TARGETS_COLLECTION), targetWithUser);
    return { id: docRef.id, ...targetWithUser };
  } catch (error) {
    console.error('Error adding target to Firestore:', error);
    throw error;
  }
};

// Update an existing target in Firestore
export const updateTargetInFirebase = async (targetId, target) => {
  try {
    const targetRef = doc(firestore, TARGETS_COLLECTION, targetId);
    await updateDoc(targetRef, target);
    return { id: targetId, ...target };
  } catch (error) {
    console.error('Error updating target in Firestore:', error);
    throw error;
  }
};

// Delete a target from Firestore
export const deleteTargetFromFirebase = async (targetId) => {
  try {
    await deleteDoc(doc(firestore, TARGETS_COLLECTION, targetId));
  } catch (error) {
    console.error('Error deleting target from Firestore:', error);
    throw error;
  }
};

// Set up real-time listener for targets
export const subscribeToTargets = (userId, callback) => {
  const q = query(collection(firestore, TARGETS_COLLECTION), where('userId', '==', userId));
  
  return onSnapshot(q, (querySnapshot) => {
    const targets = [];
    querySnapshot.forEach((doc) => {
      targets.push({ id: doc.id, ...doc.data() });
    });
    callback(targets);
  });
};