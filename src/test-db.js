// Simple test script to verify database functionality
import { initDB, getAllTargets, addTargetToDB, updateTargetInDB } from './utils/db.js';

async function testDatabase() {
  try {
    console.log('Initializing database...');
    const db = await initDB();
    console.log('Database initialized successfully:', db.name, db.version);

    console.log('Getting all targets...');
    const targets = await getAllTargets();
    console.log('Current targets:', targets);

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error during database test:', error);
  }
}

// Only run if this file is executed directly
if (typeof window !== 'undefined') {
  // In browser environment
  window.onload = () => {
    testDatabase();
  };
} else {
  // In Node.js environment (won't work for IndexedDB, just for reference)
  testDatabase();
}