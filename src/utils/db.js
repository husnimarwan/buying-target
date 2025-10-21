import { openDB } from 'idb';

const DB_NAME = 'buyingTargetDB';
const DB_VERSION = 1;
const STORE_NAME = 'targets';

let db;

// Initialize the database
export const initDB = async () => {
  if (db) return db;

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('price', 'price', { unique: false });
      }
    },
  });

  return db;
};

// Get all targets from the database
export const getAllTargets = async () => {
  const db = await initDB();
  return await db.getAll(STORE_NAME);
};

// Add a new target to the database
export const addTargetToDB = async (target) => {
  const db = await initDB();
  return await db.add(STORE_NAME, target);
};

// Update an existing target in the database
export const updateTargetInDB = async (target) => {
  const db = await initDB();
  return await db.put(STORE_NAME, target);
};

// Delete a target from the database
export const deleteTargetFromDB = async (id) => {
  const db = await initDB();
  return await db.delete(STORE_NAME, id);
};

// Clear all targets from the database
export const clearAllTargets = async () => {
  const db = await initDB();
  return await db.clear(STORE_NAME);
};